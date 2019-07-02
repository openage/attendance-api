'use strict'
const mapper = require('../mappers/employee')
const dbQuery = require('../helpers/querify')
const auth = require('../helpers/auth')
const async = require('async')
const _ = require('underscore')
const moment = require('moment')
const formidable = require('formidable')
const coverter = require('xlconverter')
const employeeService = require('../services/employees')
const leaves = require('../services/leaves')
const attendanceService = require('../services/attendances')
const offline = require('@open-age/offline-processor')
const db = require('../models')

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
            offline.queue('employee', 'new', { id: employee.id }, context)

            employee.token = auth.getToken(employee)
            return employee.save()
        })
        .then(employee => {
            res.data(mapper.toFullModel(employee))
        })
        .catch(err => res.failure(err))
}

exports.get = async (req, res) => {
    let employeeId = req.params.id === 'my' ? req.context.employee.id : req.params.id
    let employee

    if (!employeeId.isObjectId()) {
        let empQuery = {
            code: employeeId,
            organization: req.context.organization
        }
        employee = await db.employee.findOne(empQuery).populate('shiftType organization')
    } else {
        employee = await db.employee.findById(employeeId).populate('shiftType organization')
    }

    if (!employee) {
        throw new Error('profile not found')
    }

    if (employee.picUrl && !employee.picData) {
        employee.picData = await employeeService.getPicDataFromUrl(employee.picUrl)
        await employee.save()
    }

    employee.attendance = await attendanceService.getAttendanceByDate(req.query.date || new Date(), employee, { create: true }, req.context)
    if (req.params.id === 'my') {
        employee.leaveBalances = await db.leaveBalance.find({
            employee: employee.id
        }).populate('leaveType').select('units leaveType')
    }

    employee.presentDays = await db.attendance.find({
        employee: employee.id,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'present'
    }).count()

    let absents = await db.attendance.find({
        employee: employee.id,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'absent'
    }).select('ofDate').sort({ 'ofDate': 1 }).lean()

    employee.absentDates = absents.map(item => item.ofDate)
    employee.absentDays = employee.absentDates.length

    employee.today = !req.query.date

    if (employee.picUrl && !employee.picData) {
        employee.picData = await employeeService.getPicDataFromUrl(employee.picUrl)
    }
    return mapper.toModel(employee)
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
        query.code = req.query.code
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

exports.update = async (req) => {
    if (req.body.effectiveShift) {
        let shiftEffectiveDate = moment(req.body.effectiveShift.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        let currentDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        if (shiftEffectiveDate <= currentDate) {
            throw new Error('shift date change must be larger than current date')
        }
    }

    let empId = req.params.id === 'my' ? req.context.employee.id : req.params.id

    let employee = await db.employee.findById(empId).populate('supervisor shiftType')

    if (!employee) {
        throw new Error('employee not found')
    }

    employee = await employeeService.update(req.body, employee, req.context)

    return mapper.toModel(employee)
}

exports.getSupervisor = (req, res) => {
    let empId = req.params.id === 'my' ? req.context.employee.id : req.params.id
    let query = req.params.id === 'my'
        ? db.employee.find({
            _id: req.context.employee.supervisor,
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
        supervisor: req.context.employee.id.toString(),
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
        organization: req.context.organization.id,
        status: 'active'
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
