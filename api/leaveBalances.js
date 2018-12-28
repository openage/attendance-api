'use strict'
const mapper = require('../mappers/leaveBalance')
const empMapper = require('../mappers/employee')
const dbQuery = require('../helpers/querify')
const async = require('async')
const _ = require('underscore')
const moment = require('moment')
const coverter = require('xlconverter')
const formidable = require('formidable')
const db = require('../models')

var leaveTypeManeger = function (org, leaveType, cb) {
    db.leaveType.findOneOrCreate({
        organization: org,
        name: {
            $regex: leaveType,
            $options: 'i'
        }
    }, {
        organization: org,
        name: leaveType,
        unitsPerDay: 2
    }, function (err, leaveType) {
        if (err) {
            return cb(err)
        }
        cb(null, leaveType)
    })
}

var balanceManeger = function (leaveType, employee, balance, cb) {
    return db.leaveBalance.findOrCreate({
        employee: employee,
        leaveType: leaveType
    }, {
        employee: employee,
        leaveType: leaveType,
        units: balance * leaveType.unitsPerDay,
        unitsAvailed: balance * leaveType.unitsPerDay
    }, { upsert: true })
}

exports.createForMany = (req, res) => { // update for each employee in organization
    let model = {
        days: req.body.days,
        leaveType: req.body.leaveType
    }

    if (!model.days || !model.leaveType) {
        return res.failure('units-leaveTypeId required')
    }

    dbQuery.findLeaveType({ _id: model.leaveType })

        .then(leaveType => {
            if (!leaveType) {
                throw new Error('no leaveType found')
            }
            return db.employee.find({ organization: req.context.organization })
                .then(employees => {
                    return {
                        leaveType: leaveType,
                        employees: employees
                    }
                })
        })
        .then(data => {
            // delete model.days;
            // model.units.provided = data.unitsProvided;
            // model.units.left = data.unitsProvided;

            return Promise.each(data.employees, employee => {
                // model.employee = employee;

                return db.leaveBalance.findOne({
                    leaveType: req.body.leaveType,
                    employee: employee
                })
                    .then(leaveBalance => {
                        if (leaveBalance) {
                            let unitsChange = data.leaveType.unitsPerDay * model.days -
                                leaveBalance.unitsAvailed

                            leaveBalance.unitsAvailed = data.leaveType.unitsPerDay * model.days

                            leaveBalance.units = leaveBalance.units + unitsChange

                            if (!leaveBalance.units || !leaveBalance.unitsAvailed) {
                                leaveBalance.unitsAvailed = data.leaveType.unitsPerDay * model.days

                                leaveBalance.units = leaveBalance.unitsAvailed
                            }
                            return leaveBalance.save()
                        }
                        return new db.leaveBalance({
                            leaveType: req.body.leaveType,
                            employee: employee,
                            units: data.leaveType.unitsPerDay * model.days,
                            unitsAvailed: data.leaveType.unitsPerDay * model.days
                        }).save()
                    })
                    .catch(err => {
                        throw err
                    })
            })
        })
        .then(() => res.success('units of your organization employees are updated'))
        .catch(err => res.failure(err))
}

// exports.search = (req, res) => {

//     let query = {
//         employee: req.employee.id
//     };
//     db.leaveBalance.find(query)
//         .populate('leaveType')
//         .then(leaveBalances => {
//             res.page(mapper.toSearchModel(leaveBalances));
//         })
//         .catch(err => {
//             res.failure(err);
//         });
// };

exports.update = (req, res) => {
    let model = {
        employee: req.params.id,
        leaveType: req.body.leaveType,
        days: req.body.days
    }
    dbQuery.findLeaveType({ _id: model.leaveType })
        .then(leaveType => {
            return db.leaveBalance.findOne({
                leaveType: leaveType.id,
                employee: model.employee
            })
                .then(leaveBalance => {
                    if (leaveBalance) {
                        let unitsChange = (leaveType.unitsPerDay * model.days) - leaveBalance.unitsAvailed
                        leaveBalance.unitsAvailed = leaveType.unitsPerDay * model.days
                        leaveBalance.units = leaveBalance.units + unitsChange

                        if (!leaveBalance.units || !leaveBalance.unitsAvailed) {
                            leaveBalance.unitsAvailed = leaveType.unitsPerDay * model.days
                            leaveBalance.units = leaveBalance.unitsAvailed
                        }

                        return leaveBalance.save()
                    }
                    return new db.leaveBalance({
                        employee: req.params.id,
                        leaveType: req.body.leaveType,
                        units: leaveType.unitsPerDay * model.days,
                        unitsAvailed: leaveType.unitsPerDay * model.days
                    }).save()
                })
        })
        .then(() => {
            res.success('balance updated successfully')
        })
        .catch(err => res.failure(err))
}

exports.getCurrentYearBal = (req, res) => {
    let query = {
        employee: req.query.id || req.employee.id
    }

    let leaveBalance = db.leaveBalance.find(query).populate('leaveType')

    leaveBalance
        .then(leaveBalances => {
            return Promise.mapSeries(leaveBalances, bal => {
                return db.leave.find({
                    leaveType: bal.leaveType.id,
                    employee: req.params.id,
                    status: req.query.status,
                    date: {
                        $gte: moment().startOf('year'),
                        $lte: moment().endOf('year')
                    }
                }).count()
                    .then(leavesCount => {
                        bal.approvedLeaves = leavesCount
                        return bal
                    })
            })
                .then(leaveBalances => {
                    res.page(mapper.toSearchModel(leaveBalances))
                })
                .catch(err => {
                    throw err
                })
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.organizationLeaveBalances = (req, res) => {
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)
    let totalRecordsCount = 0

    let query = {
        organization: req.context.organization,
        status: 'active'
    }

    if (req.query.name) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    if (req.query.tagId) {
        query.tags = { $in: [global.toObjectId(req.query.tagId)] }
    }

    Promise.all([
        db.employee.find(query).count(),
        db.employee.find(query)
            .sort({ name: 1 })
            .select('name code')
            .skip(fromPage).limit(pageLmt)
    ]).spread((totalRecordsCount, employees) => {
        totalRecordsCount = totalRecordsCount
        return Promise.mapSeries(employees, employee => {
            return db.leaveBalance.find({ employee: employee.id })
                .populate('leaveType')
                .then(leaveBalances => {
                    if (_.isEmpty(leaveBalances)) {
                        return employee
                    }
                    employee.leaveBalances = leaveBalances
                    return employee
                })
        })
            .then(employees => res.page(
                empMapper.toSearchModel(employees),
                pageLmt,
                PageNo,
                totalRecordsCount))
    }).catch(err => res.failure(err))
}

exports.multiUpdateBalance = (req, res) => {
    let employeeCode = req.params.employee
    let balsToUpdate = req.body

    dbQuery.findEmployee({ code: employeeCode, organization: req.context.organization })
        .then(employee => {
            if (!employee) {
                throw new Error('employee not found while updating leave')
            }
            return Promise.each(balsToUpdate, balance => {
                let query
                if (balance.leaveType.id) {
                    query = db.leaveType.findById(balance.leaveType.id)
                } else {
                    if (balance.leaveType.name) {
                        query = db.leaveType.findOne({
                            organization: req.context.organization,
                            name: {
                                $regex: balance.leaveType.name,
                                $options: 'i'
                            }
                        })
                    }
                }
                return query
                    .then(leaveType => {
                        return db.leaveBalance.findOne({
                            leaveType: leaveType,
                            employee: employee
                        })
                            .then(leaveBalance => {
                                if (leaveBalance) {
                                    // if (balance.days < 0) {
                                    //     return leaveBalance;
                                    // }

                                    // if (leaveBalance.unitsAvailed < 0) {
                                    //     leaveBalance.unitsAvailed = 0;
                                    // }

                                    let unitsChange = (leaveType.unitsPerDay * Number(balance.days)) -
                                            (leaveBalance.units || leaveBalance.unitsAvailed)

                                    // leaveBalance.unitsAvailed = leaveType.unitsPerDay * balance.days;
                                    leaveBalance.unitsAvailed = leaveBalance.unitsAvailed + unitsChange
                                    leaveBalance.units = leaveBalance.units + unitsChange

                                    if (!leaveBalance.units || !leaveBalance.unitsAvailed) {
                                        leaveBalance.unitsAvailed = leaveType.unitsPerDay * Number(balance.days)
                                        leaveBalance.units = leaveBalance.unitsAvailed
                                    }

                                    // leaveBalance.units = leaveType.unitsPerDay * Number(balance.days);
                                    // leaveBalance.unitsAvailed = leaveBalance.units;

                                    return leaveBalance.save()
                                }
                                return new db.leaveBalance({
                                    employee: employee,
                                    leaveType: leaveType,
                                    units: leaveType.unitsPerDay * Number(balance.days),
                                    unitsAvailed: leaveType.unitsPerDay * Number(balance.days)
                                }).save()
                            })
                    })
            })
                .then((leaveBalance) => {
                    return res.success('leave balances updated Successfully')
                })
        })
        .catch(err => {
            return res.failure(err)
        })
}

exports.leaveBalanceExtractorByExcel = (req, res) => {
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
            return cb(null, coverter.xlToObjects(xlSheetInfo.path))
        },
        function (balsData, cb) {
            async.eachSeries(balsData, function (balance, callMe) {
                for (var index in balance) {
                    if (balance[index] === '' && index !== 'code') {
                        balance[index] = 0
                    }
                    if (balance[index] === '' && index === 'code') {
                        balance[index] = '0'
                    }
                }
                async.waterfall([
                    function (cb) {
                        leaveTypeManeger(req.context.organization, balance.leaveType, cb)
                    },
                    function (leaveType, cb) {
                        db.employee.findOne({
                            organization: req.context.organization,
                            code: balance.code
                        },
                        function (err, employee) {
                            if (err) {
                                return cb(err)
                            }
                            if (!employee) {
                                return callMe(null)
                            }
                            return cb(null, leaveType, employee)
                        })
                    },
                    function (leaveType, employee, cb) {
                        console.log(`update balance of ${employee.name || employee.code}`)
                        new Promise((resolve, reject) => {
                            return cb(null, resolve(balanceManeger(leaveType, employee, balance.days)))
                        })
                    }
                ],
                function (err) {
                    if (err) {
                        return cb(err)
                    }
                    return callMe(null)
                })
            },
            function (err) {
                if (err) {
                    return cb(err)
                }
                return cb(null)
            })
        }
    ],
    function (err) {
        if (err) {
            return res.failure(err)
        }
        return res.success('leave balance updated successfully')
    })
}
