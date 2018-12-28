'use strict'
const mapper = require('../mappers/employee')
const mailerConfig = require('config').get('mailer')
const providerConfig = require('config').get('providers')
const dbQuery = require('../helpers/querify')
let Client = require('node-rest-client-promise').Client
let client = new Client()
const logger = require('@open-age/logger')('employee')
const auth = require('../middleware/authorization')
const async = require('async')
const updationScheme = require('../helpers/updateEntities')
const _ = require('underscore')
const moment = require('moment')
const formidable = require('formidable')
const coverter = require('xlconverter')
const Guid = require('guid')
const employeeService = require('../services/employees')
const leaves = require('../services/leaves')
const shiftService = require('../services/shifts')
const magic = require('config').get('webServer')

const systemConfig = require('config').get('system')
const offline = require('@open-age/offline-processor')
const fingerMapper = require('../mappers/fingerPrint')
const db = require('../models')

var getEmpModel = function (employee) {
    let empData = {
        email: (employee.email || employee.Email),
        phone: employee.phone || employee.Phone,
        name: employee.name || employee.Name,
        code: employee.code || employee.Code,
        picUrl: employee.picUrl === 'NULL' ||
            employee.picUrl === 'null' ||
            employee.picUrl === '' ||
            employee.picUrl === ' ' ? null : employee.picUrl,
        status: 'activate',
        organization: employee.org,
        designation: employee.designation || employee.Designation
    }

    for (var key in empData) {
        if (empData[key] === 'NULL' || empData[key] === 'null') {
            empData[key] = null
        }
    }

    return empData
}

var deviceManeger = (employee, deviceId) => {
    return db.employee.update({ // set device id set to null for user having same deviceId
        _id: {
            $ne: employee.id
        },
        device: {
            id: deviceId
        }
    }, {
        device: {
            id: null
        }
    })
        .then(() => {
            employee.device.id = deviceId
            return employee.save()
        }).catch(err => {
            throw err
        })
}

let toFromDate = () => {
    let fromDate = moment()
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)

    let toDate = moment()
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')
    return {
        fromDate: fromDate,
        toDate: toDate
    }
}

exports.createWithExternalToken = (req, res) => {
    if (!req.body.device || !req.body.device.id) {
        return res.failure('device Id required')
    }
    let deviceId = req.body.device.id

    let extUrl = req.context.organization.externalUrl
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': req.headers['external-token']
        },
        path: {
            id: 'my'
        }
    }

    let empModel
    let supervisor
    let employees = []

    client.getPromise(extUrl, args)
        .then((response) => {
            if (!response.data.isSuccess) {
                throw response.data.error || response.data.message
            }
            let data = response.data.data

            empModel = {
                name: data.name,
                code: data.code,
                phone: data.phone,
                email: data.email,
                picUrl: data.picUrl,
                picData: data.picData,
                EmpDb_Emp_id: data.id,
                userType: data.userType || 'normal',
                designation: data.designation ? data.designation : '',
                organization: req.context.organization
            }
            employees.push(empModel)

            if (data.supervisor) {
                supervisor = {
                    code: data.supervisor.code,
                    name: data.supervisor.name,
                    phone: data.supervisor.phone,
                    email: data.supervisor.email,
                    picUrl: data.supervisor.picUrl,
                    picData: data.supervisor.picData,
                    EmpDb_Emp_id: data.supervisor.id,
                    designation: data.supervisor.designation ? data.supervisor.designation : '',
                    organization: req.context.organization
                }
                employees.push(supervisor)
            }
            return employees
        })
        .then(employees => {
            return employeeService.shiftManeger(employees)
        })
        .then(employees => {
            return employeeService.employeeManeger(employees)
        })
        .then(employees => {
            return Promise.each(employees, emp => emp.save())
        })
        .then(employees => {
            let employee = employees[0]
            let supervisor = employees[1]
            return dbQuery.getTotalLeaveBalance(employee)
                .then(leaveBalances => {
                    employee.leaveBalances = leaveBalances
                    return {
                        employee: employee,
                        supervisor: supervisor
                    }
                })
        })
        .then(data => { // today attendance
            let dates = toFromDate()
            return db.attendance.findOne({
                ofDate: {
                    $gte: dates.fromDate,
                    $lt: dates.toDate
                },
                employee: data.employee.id
            })
                .populate('recentMostTimeLog')
                .then(attendance => {
                    data.employee.attendance = attendance
                    return data
                })
        })
        .then(data => {
            if (!data.employee.token) {
                data.employee.token = auth.getToken(data.employee)
                return data.employee.save().then(
                    () => {
                        return data
                    }
                )
            }
            return data
        })
        .then(data => { // device Id Manager
            return deviceManeger(data.employee, deviceId).then(() => data)
        })
        .then(data => {
            data.employee.organization = req.context.organization
            res.data(mapper.toFullModel(data.employee))
            if (!data.supervisor) {
                return data.employee
            }
            data.employee.supervisor = data.supervisor
            return data.employee.save()
        })
        .then(employee => {
            return employeeService.teamManeger(employee)
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.create = (req, res) => { // use by ems
    let data = req.body
    let model = {
        name: data.name,
        code: data.code,
        EmpDb_Emp_id: data.id,
        organization: req.context.organization
    }

    dbQuery.findEmployee({ // EmpDb_Emp_id is unique over one organization
        organization: model.organization.id,
        EmpDb_Emp_id: model.EmpDb_Emp_id
    })
        .then(employee => {
            if (employee) {
                throw new Error('employee already exist')
            }
            model.status = 'active'
        })
        .then(() => new db.employee(model).save())
        .then(employee => {
            let context = {}
            context.organization = {}
            context.employee = employee.id.toString()
            context.organization.id = employee.organization.id.toString()
            context.processSync = true
            offline.queue('employee', 'new', { employee: employee }, context)

            employee.token = auth.getToken(employee)
            return employee.save()
        })
        .then(employee => {
            res.data(mapper.toFullModel(employee))
        })
        .catch(err => res.failure(err))
}

exports.get = async (req, res) => {
    let employeeId = req.params.id === 'my' ? req.employee.id : req.params.id

    if (!employeeId.isObjectId()) {
        let empQuery = {
            code: employeeId,
            organization: req.context.organization
        }
        const employee = await db.employee.findOne(empQuery)
        employeeId = employee.id
    }

    let query = {
        _id: req.params.id
    }

    let dates = {
        fromDate: req.query.date ? moment(req.query.date)
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d : moment()
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d,

        toDate: req.query.date ? moment(req.query.date)
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d : moment()
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    }
    let getProfile = new Promise((resolve, reject) => {
        resolve(db.employee.findOne({
            _id: employeeId
        }).populate('shiftType'))
    })

    let getLeaveBalance = new Promise((resolve, reject) => {
        if (req.params.id === 'my') {
            return resolve(dbQuery.getTotalLeaveBalance(employeeId))
        }
        resolve(undefined)
    })

    let getTodayAttendance = db.attendance.findOne({
        ofDate: {
            $gte: dates.fromDate.toISOString(),
            $lt: dates.toDate.toISOString()
        },
        employee: employeeId
    })
        .populate('recentMostTimeLog timeLogs')

    let getPresentCountOfMonth = db.attendance.find({
        employee: employeeId,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'present'
    }).count()

    let getAbsentsOfMonth = db.attendance.find({
        employee: employeeId,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'absent'
    }).select('ofDate').sort({ 'ofDate': 1 }).lean()

    Promise.all([
        getProfile, getTodayAttendance, getLeaveBalance, getPresentCountOfMonth, getAbsentsOfMonth
    ])
        .spread((employee, attendance, leaveBalances, presentCount, absents) => {
            let absentCount = 0
            let absentDatesCount = []
            if (!employee) {
                throw new Error('profile not found')
            }
            employee.attendance = attendance
            employee.leaveBalances = leaveBalances
            employee.presentDays = presentCount
            employee.absentDays = absents.length
            employee.absentDates = _.pluck(absents, 'ofDate')
            employee.today = !req.query.date

            if (employee.picUrl && !employee.picData) {
                return employeeService.getPicDataFromUrl(employee.picUrl)
                    .then((picData) => {
                        employee.picData = picData
                        employee.save()
                        return res.data(mapper.toModel(employee))
                    })
                    .catch(err => {
                        return res.data(mapper.toModel(employee))
                    })
            } else {
                res.data(mapper.toModel(employee))
            }
        }).catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)
    let totalRecordsCount = 0

    let query = {
        status: 'active',
        organization: req.context.organization.id
        // phone: { $exists: true },
        // _id: { $ne: req.employee }
    }

    if (req.query.name) {
        query.$or = [{
            name: {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }, {
            code: {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }]
    }

    if (req.query.code) {
        query.code = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    Promise.all([
        db.employee.find(query).count(),
        db.employee.find(query).populate('shiftType supervisor').sort({ name: 1 })
            .skip(fromPage).limit(pageLmt)

    ]).then((result) => {
        Promise.each(result[1], employee => {
            return db.attendance.findOne({
                employee: employee._id,
                ofDate: {
                    $gte: fromDate,
                    $lt: toDate
                }
            }).then((attendance) => {
                employee.attendance = attendance
            })
        }).then(() => {
            return res.page(mapper.toSearchModel(result[1]), pageLmt, PageNo, result[0])
        })
    }).catch(err => {
        res.failure(err)
    })
}

exports.update = (req, res) => {
    if (req.body.effectiveShift) {
        let shiftEffectiveDate = moment(req.body.effectiveShift.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        let currentDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        if (shiftEffectiveDate <= currentDate) {
            return res.failure('shift date change must be larger than current date')
        }
    }

    var data = req.body
    var newShiftType
    if (req.body.shiftType) {
        newShiftType = req.body.shiftType || req.body.shiftType.id
        delete data.shiftType
    }
    let empId = req.params.id === 'my' ? req.employee.id : req.params.id

    dbQuery.findEmployee({
        _id: empId
    })
        .then(employee => {
            if (!employee) {
                throw new Error('employee not found')
            }
            employee = updationScheme.update(data, employee)
            return employee
        })
        .then(employee => {
            if (!newShiftType || !newShiftType.id) {
                return employee
            }
            return dbQuery.findShiftType({
                _id: newShiftType.id
            })
                .then(shiftType => {
                    var fromDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
                    return db.attendance.findOne({
                        employee: employee.id.toString(),
                        ofDate: fromDate
                    })
                        .then(attendance => {
                            var context = {}
                            context.organization = {}
                            context.employee = employee.id.toString()
                            context.organization.id = employee.organization.toString()
                            context.processSync = true
                            if (attendance.status !== 'absent' || attendance.status !== 'onLeave') {
                                throw new Error('shift can not be updated')
                            }
                            return shiftService.getByTime(fromDate, shiftType, context)
                                .then(shift => {
                                    attendance.shift = shift
                                    attendance.save()
                                    employee.shiftType = shiftType
                                    return employee
                                })
                        })
                })
        })
        .then(employee => {
            return employee.save()
        })
        .then(employee => {
            res.data(mapper.toModel(employee))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.getSupervisor = (req, res) => {
    let empId = req.params.id === 'my' ? req.employee.id : req.params.id
    let query = req.params.id === 'my'
        ? db.employee.find({
            _id: req.employee.supervisor,
            status: 'active'
        })
        : db.employee.aggregate([{
            $match: {
                _id: global.toObjectId(req.params.id)
            }
        }, {
            $lookup: {
                localField: 'supervisor',
                from: 'employees',
                foreignField: '_id',
                as: 'supervisor'
            }
        },
        {
            $match: {
                'supervisor.status': 'active'
            }
        },
        {
            $project: {
                'supervisor': 1,
                '_id': 0
            }
        },
        {
            $unwind: '$supervisor'
        },
        {
            $project: {
                _id: '$supervisor._id',
                'name': '$supervisor.name',
                'code': '$supervisor.code',
                'picData': '$supervisor.picData',
                'picUrl': '$supervisor.picUrl',
                'designation': '$supervisor.designation',
                'email': '$supervisor.email',
                'phone': '$supervisor.phone'
            }
        }
        ])

    query
        .then(supervisor => {
            supervisor = supervisor[0]
            if (!supervisor) {
                return res.data({})
            }
            let fromDate = moment()
                .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

            let toDate = moment()
                .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d

            return db.attendance.findOne({
                employee: supervisor._id.toString() || supervisor.id.toString(),
                ofDate: {
                    $gte: fromDate,
                    $lt: toDate
                }
            })
                .then(attendance => {
                    supervisor.attendance = attendance || null
                    res.data(mapper.toModel(supervisor))
                })
        })
        .catch(err => res.failure(err))
}

exports.searchInTeam = (req, res) => {
    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d

    let PageNo = Number(req.query.pageNo)
    let toPage = (PageNo || 1) * 10
    let fromPage = toPage - 10
    let pageLmt = 10

    let query = {}
    let searchFromEmployees

    if (req.query.name) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    db.team.find({
        supervisor: req.employee.id.toString(),
        employee: { $exists: true }
    })
        .then(team => {
            return _.pluck(team, 'employee')
        })
        .then(searchFromEmployees => {
            query._id = {
                $in: searchFromEmployees
            }
            return db.employee.find(query)
                .skip(fromPage).limit(pageLmt)
        })
        .then(employees => {
            Promise.each(employees, employee => {
                return db.attendance.findOne({
                    employee: employee._id,
                    ofDate: {
                        $gte: fromDate,
                        $lt: toDate
                    }
                }).then((attendance) => {
                    employee.attendance = attendance
                })
            }).then(() => {
                res.page(mapper.toSearchModel(employees))
            })
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.getEmployeesBirthdays = (req, res) => {
    let date = req.query.date ? moment(req.query.date).format('DD-MM') : moment().format('DD-MM')
    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    db.employee.find({
        organization: req.context.organization.id
    })
        .then(employees => {
            var empBirthdayList = []
            return Promise.mapSeries(employees, employee => {
                if (employee.dob) {
                    if (moment(employee.dob).format('DD-MM') === date) {
                        return db.attendance.findOne({
                            employee: employee._id,
                            ofDate: {
                                $gte: fromDate,
                                $lt: toDate
                            }
                        }).then(attendance => {
                            employee.attendance = attendance
                            empBirthdayList.push(employee)
                            return empBirthdayList
                        })
                    }
                }
            }).then(() => {
                res.page(mapper.toSearchModel(empBirthdayList))
            })
        })
}

// exports.exporter = (req, res) => {

//     let exportFrom = req.context.organization.externalDumpUrl;
//     let args = {
//         headers: {
//             'Content-Type': 'application/json',
//             'x-access-token': req.headers['external-token']
//         }
//     };

//     client.getPromise(exportFrom, args)
//         .then(response => {
//             response = response.data;
//             if (!response.isSuccess) {
//                 throw response.error || response.message;
//             }
//             return response.items;
//         })
//         .then(employees => {
//             if (_.isEmpty(employees)) {
//                 return res.success('No employee found from External Database');
//             }
//             Promise.each(employees, extEmployee => {

//                 dbQuery.findEmployee({
//                     EmpDb_Emp_id: extEmployee.id,
//                     organization: req.context.organization.id
//                 });

//             });
//         });
// };

exports.createWithTunnel = (req, res) => {
    if (!req.headers['external-token']) {
        return res.failure('external-token required')
    }

    if (!req.body.device || !req.body.device.id) {
        return res.failure('device Id required')
    }

    let deviceId = req.body.device.id

    let tunnelUrl = req.context.organization.externalUrl
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'orgCode': req.headers['org-code'],
            'x-api-token': req.headers['external-token']
        }
    }
    let response

    client.getPromise(tunnelUrl, args)
        .then(extData => {
            response = extData.data
            if (extData.data.length) {
                throw new Error('ExtServer not responding')
            }
        })
        .then(result => {
            let empData = {
                email: response.Email || response.email,
                Ext_token: req.headers['external-token'],
                mobile: response.Mobile,
                name: response.Name,
                code: response.CurrentRole.Code,
                status: 'active',
                organization: req.context.organization,
                designation: response.CurrentRole.Designation.Name
            }
            return [empData]
        })
        .then(employees => {
            return employeeService.employeeManeger(employees)
        }).then(employees => {
            return employeeService.shiftManeger(employees)
                .then(employees => {
                    return Promise.each(employees, emp => emp.save())
                })
        })
        .then(employees => {
            let employee = employees[0]
            let supervisor = employees[1]
            return dbQuery.getTotalLeaveBalance(employee)
                .then(leaveBalances => {
                    employee.leaveBalances = leaveBalances
                    return {
                        employee: employee,
                        supervisor: supervisor
                    }
                })
        })
        .then(data => { // today attendance
            let dates = toFromDate()
            return db.attendance.findOne({
                ofDate: {
                    $gte: dates.fromDate,
                    $lt: dates.toDate
                },
                employee: data.employee.id
            }).then(attendance => {
                data.employee.attendance = attendance
                return data
            })
        })
        .then(data => { // device Id Manager
            return deviceManeger(data.employee, deviceId).then(() => data)
        })
        .then(data => {
            if (!data.employee.token) {
                data.employee.token = auth.getToken(data.employee)
                return data.employee.save().then(
                    () => {
                        return data
                    }
                )
            }
            return data
        })
        .then(data => {
            data.employee.organization = req.context.organization
            res.data(mapper.toFullModel(data.employee))
            if (!data.supervisor) {
                return data.employee
            }
            data.employee.supervisor = data.supervisor
            return data.employee.save()
        })
        .then(employee => {
            return employeeService.teamManeger(employee)
        })
        .catch(err => res.failure(err))
}

exports.updateEmpsWithXl = (req, res) => {
    var xlSheetInfo
    var form = new formidable.IncomingForm()

    async.waterfall([
        function (cb) {
            var files = form.parse(req, function (err, fields, files) {
                if (err) {
                    return cb(err)
                }
                var xlSheet = files.file
                xlSheetInfo = {
                    path: xlSheet.path,
                    type: xlSheet.type,
                    size: xlSheet.size + ' bytes'
                }
                console.log(xlSheetInfo)
                cb(null, xlSheetInfo)
            })
        },
        function (xlSheetInfo, cb) {
            return cb(null, coverter.getRowsOfCols(xlSheetInfo.path, ['EmployeeNo', 'ImageBoxUrl']))
        },
        function (xlObjects, cb) {
            async.eachSeries(xlObjects, (obj, callme) => {
                if (obj.EmployeeNo === '' || obj.EmployeeNo === 'NULL' || obj.EmployeeNo === 'null') {
                    return callme(null)
                }
                db.employee.update({
                    code: obj.EmployeeNo
                }, {
                    $set: {
                        picUrl: obj.ImageBoxUrl === 'NULL' ||
                            obj.ImageBoxUrl === 'null' ||
                            obj.ImageBoxUrl === 'undef' ||
                            obj.ImageBoxUrl === '' ||
                            obj.ImageBoxUrl === ' ' ? null : obj.ImageBoxUrl
                    }
                }, function (err, data) {
                    if (err) {
                        return callme(err)
                    }
                    callme(null)
                })
            }, function (err) {
                if (err) {
                    return cb(err)
                }
                cb(null)
            })
        }
    ], function (err) {
        if (err) {
            return res.failure(err)
        }
        res.success('Employee data updated')
    })
}

exports.getEmpByAdmin = (req, res) => {
    let query = {
        _id: req.params.id
    }
    let startOfMonth = moment().startOf('month')._d
    let endOfMonth = moment().endOf('month')._d

    let getProfile = db.employee.findOne(query).populate('shiftType supervisor')

    let getMonthAvg = db.monthSummary.findOne({
        employee: req.params.id,
        weekStart: startOfMonth,
        weekEnd: endOfMonth
    })

    // let getMonthAvg = db.attendance.aggregate([{
    //     $match: {
    //         employee: global.toObjectId(req.params.id)
    //     }
    // },
    // {
    //     $group: {
    //         _id: '$employee',
    //         avg: {
    //             $avg: '$hoursWorked'
    //         }
    //     }
    // }
    // ]);

    Promise.all([
        getProfile, getMonthAvg
    ])
        .spread((employee, monthAvg) => {
            if (!employee) {
                throw new Error('profile not found')
            }

            let returnData = mapper.toModel(employee)

            if (monthAvg) {
                returnData.avgHours = monthAvg.attendanceCount ? monthAvg.hoursWorked / monthAvg.attendanceCount : 0
            }

            // if (!_.isEmpty(monthAvg)) {
            //     returnData.avgHours = monthAvg.hoursWorked ? monthAvg[0].avg : 0;
            // } else {
            //     returnData.avgHours = 0;
            // }
            if (employee.picUrl && !employee.picData) {
                return employeeService.getPicDataFromUrl(employee.picUrl)
                    .then((picData) => {
                        employee.picData = picData
                        employee.save()
                        returnData.picData = picData
                        return res.data(returnData)
                    })
                    .catch(err => {
                        return res.data(returnData)
                    })
            } else {
                return res.data(returnData)
            }
        })
        .catch(err => res.failure(err))
}

exports.uploadNightShifters = (req, res) => {
    var xlSheetInfo
    var shiftTypeId = req.params.shiftType
    var form = new formidable.IncomingForm()

    async.waterfall([
        function (cb) {
            var files = form.parse(req, function (err, fields, files) {
                if (err) {
                    return cb(err)
                }
                var xlSheet = files.file
                xlSheetInfo = {
                    path: xlSheet.path,
                    type: xlSheet.type,
                    size: xlSheet.size + ' bytes'
                }
                console.log(xlSheetInfo)
                cb(null, xlSheetInfo)
            })
        },
        function (xlSheetInfo, cb) {
            return cb(null, coverter.xlToObjects(xlSheetInfo.path))
        },
        function (xlObjects, cb) {
            async.eachSeries(xlObjects, (obj, callme) => {
                if (obj.code === '' || obj.code === 'NULL' || obj.code === 'null') {
                    return callme(null)
                }

                db.employee.update({
                    code: obj.code.toString()
                }, {
                    $set: {
                        shiftType: shiftTypeId
                    }
                }, function (err, data) {
                    if (err) {
                        return callme(err)
                    }
                    callme(null)
                })
            }, function (err) {
                if (err) {
                    return cb(err)
                }
                cb(null)
            })
        }
    ], function (err) {
        if (err) {
            return res.failure(err)
        }
        res.success('Night Shift Employees updated')
    })
}

// syncEmployees Start

exports.syncEmployees = async (req) => {
    let syncConfigurations = {
        config: {
            api_key: req.headers['external-token']
        }
    }
    await offline.queue('employee', 'sync', syncConfigurations, req.context)
    return 'Sync request submitted'
}
// syncEmployees End

exports.notTakenLeaves = (req, res) => {
    let date = moment()

    let lastDays = 30

    let supervisorId = ''

    if (req.query.supervisorId) { supervisorId = req.query.supervisorId } else { return res.failure(`supervisorId is required`) }

    if (req.query.date) { date = moment(date) }

    if (req.query.lastDays) { lastDays = req.query.lastDays }

    leaves.notTakenLeave(supervisorId, date, parseInt(lastDays)).then(result => {
        if (!result || result.totalEmps == 0) { return res.page([]) }
        res.page(mapper.toSearchModel(result.employees))
    }).catch(err => res.failure(err))
}

exports.magicLink = (req, res) => {
    let query = {}
    if (req.body.phone) { query.phone = req.body.phone }
    if (req.body.email) { query.email = req.body.email }
    var guid = Guid.create()

    db.employee.findOne(query)
        .then(employee => {
            employee.guid = guid
            employee.save()
            res.data(`${magic.url}/api/employees/get/linksMagic/` + guid)
        })
}

exports.linksMagic = (req, res) => {
    db.employee.findOne({
        guid: req.params.guid
    }).populate('organization')
        .then(employee => {
            employee.guid = ''
            employee.save()
            let responseLink = `http://links.domain.com/lanuch&` + employee.token + '&' + employee.organization.code + '&home'
            res.data(responseLink)
        })
}

exports.fingerRegistration = async (req, res) => {
    const log = logger.start('fingerRegistration')
    if (!req.context) {
        req.context = {}
    }

    const id = req.params.id

    const employee = await employeeService.addFingerPrint(id, req.body, req.query.operation, req.context)

    return res.data(mapper.toModel(employee))
}

exports.updateFingerMark = async (req, res) => {
    const log = logger.start('fingerRegistration')
    if (!req.context) {
        req.context = {}
    }

    const id = req.params.id

    const fingerPrint = await employeeService.addOrUpdateFingerMark(id, req.body, req.context)

    return res.data(fingerMapper.toModel(fingerPrint))
}

exports.getFingerMarks = async (req, res) => {
    const log = logger.start('fingerRegistration')
    if (!req.context) {
        req.context = {}
    }

    const id = req.params.id

    const fingerPrint = await employeeService.getFingerMark(id, req.context)

    return res.data(fingerMapper.toModel(fingerPrint))
}
