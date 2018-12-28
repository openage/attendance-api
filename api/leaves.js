'use strict'
const mapper = require('../mappers/leave')
const async = require('async')
const updationScheme = require('../helpers/updateEntities')
const _ = require('underscore')
const moment = require('moment')
const logger = require('@open-age/logger')('api.leaves')
const shiftCheck = require('../services/shifts').getDayStatus
const offline = require('@open-age/offline-processor')

const leaves = require('../services/leaves')
const db = require('../models')

var configureNotification = function (supervisorId, leaveId) {
    if (!supervisorId) {
        return Promise.resolve(null)
    }

    return db.notification.find({
        task: { $exists: true },
        'task.type': 'leave',
        'task.id': leaveId
    })
        .then(notifications => {
            async.eachSeries(notifications, (notification, next) => {
                notification.status = 'inactive'
                notification.save()
                db.employee.findById(supervisorId)
                    .then(supervisor => {
                        let senderNotification = _.find(supervisor.notifications, item => {
                            if (item.notification.toString() === notification.id.toString()) {
                                return item
                            }
                        })
                        supervisor.notifications.splice(supervisor.notifications.indexOf(senderNotification), 1)
                        supervisor.save().then(() => {
                            next()
                        }).catch(err => { throw err })
                    })
            }, (err) => {

            })
        })
        .catch(err => {
            throw err
        })
}

var futureShiftManager = function (leave, leaveDate) {
    let fromDate = moment(leaveDate) // for perticular leaveDate
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = moment(leaveDate)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d

    return shiftCheck(leave.employee.shiftType, leaveDate)
        .then(dayData => {
            return db.shift.findOrCreate({
                shiftType: leave.employee.shiftType,
                date: {
                    $gte: fromDate,
                    $lt: toDate
                }
            }, {
                shiftType: leave.employee.shiftType,
                status: dayData.status,
                holiday: dayData.holiday,
                date: moment(leaveDate)
                    .set('hour', moment(leave.employee.shiftType.startTime).hours())
                    .set('minute', moment(leave.employee.shiftType.startTime).minutes())
                    .set('second', 0)
                    .set('millisecond', 0)._d
            })
        })
        .then(shift => {
            db.attendance.findOrCreate({ // it will be created when any person on leave
                employee: leave.employee,
                shift: shift.result
            }, {

                employee: leave.employee,
                status: 'onLeave',
                shift: shift.result,
                ofDate: fromDate

            }, { upsert: true })
        })
        .catch(err => {
            throw err
        })
}

var onApproved = function (leave) {
    let leaveDate = moment(leave.date)
    let DaysTaken

    if (leave.leaveType.unlimited) {
        DaysTaken = leave.units
    } else {
        DaysTaken = Math.ceil(leave.units / leave.leaveType.unitsPerDay)
    }

    return Promise.each(new Array(DaysTaken), () => {
        return futureShiftManager(leave, leaveDate)
            .then(() => {
                leaveDate = moment(leaveDate).add(1, 'day')
            })
            .catch(err => {
                throw err
            })
    })
        .then(() => leave)
        .catch(err => {
            throw err
        })
}

var leaveValidator = function (employee, data) {
    let fromDate = moment(data.date).startOf('day')

    let toDate = moment(data.date).startOf('day').add(data.days, 'day')

    return db.leave.findOne({
        employee: employee,
        date: {
            $gte: fromDate,
            $lt: toDate
        }
    })
}

exports.create = async (req) => {
    let leave = await leaves.create(req.body, req.context)
    return mapper.toModel(leave)
}

exports.bulk = async (req) => {
    for (const item of req.body.items) {
        await leaves.create(item, req.context)
    }

    return `added '${req.body.items.length}' leaves`
}
// TODO: DELETE THIS /MANY API WHEN ios MOVE TO SIMPLE ONE
exports.createMultiple = (req, res) => {
    let body = req.body

    if (!body.leaves) {
        return res.failure('send array of leaves')
    }

    Promise.each(body.leaves, model => {
        // let data = {
        //     date: leave.date,
        //     isPlanned: leave.isPlanned,
        //     days: leave.days,
        //     status: 'submitted',
        //     reason: leave.reason,
        //     comment: leave.comment,
        //     leaveType: leave.leaveType,
        //     employee: req.employee
        // };

        // return db.leaveBalance.findOne({
        //         leaveType: data.leaveType,
        //         employee: req.employee
        //     })
        //     .populate('leaveType')
        //     .then(leaveBalance => {
        //         if (!leaveBalance) {
        //             throw ('no leave balance found');
        //         }
        //         let unitsInLT = leaveBalance.leaveType.unitsPerDay;

        //         if (data.days % 1 === 0) {
        //             data.units = data.days * unitsInLT; //for integer
        //         } else {
        //             data.units = Math.ceil(data.days * unitsInLT); // for float
        //         }

        //         if (leaveBalance.units < data.units) {
        //             throw (`you can not apply leave for ${leaveBalance.leaveType.name}`);
        //         }

        //         return new db.leave(data).save()
        //             .then(leave => {
        //                 leave.days = data.days;
        //                 return { leaveBalance: leaveBalance, unitsToDeduct: leave.units };
        //             })
        //             .catch(err => { throw err; });
        //     })
        //     .then(data => {
        //         data.leaveBalance.units = data.leaveBalance.units - data.unitsToDeduct;
        //         return data.leaveBalance.save();
        //     });
        // // .catch(err => { throw err; });
        let data = {
            date: model.date,
            toDate: model.toDate,
            bot: model.bot,
            days: model.days,
            status: 'submitted',
            reason: model.reason,
            Ext_id: model.externalId,
            employee: req.employee
        }

        var log = logger.start('Applying Leave')
        logger.info(`Applying Leave of ${data.employee.name} of ${data.date}`)

        let getleaveBalance = new Promise((resolve, reject) => {
            if (!model.employee || !model.employee.code) {
                data.leaveType = model.leaveType
                data.employee = data.employee

                return db.leaveBalance.findOne({
                    leaveType: data.leaveType,
                    employee: data.employee
                }).populate('leaveType')
                    .then(leaveBalance =>
                        resolve(leaveBalance))
            }

            return db.employee.findOne({
                code: model.employee.code,
                organization: req.context.organization
            })
                .then(employee => {
                    if (!employee) {
                        throw new Error('employee not found')
                    }
                    data.employee = employee
                    let query

                    if (model.type.name) {
                        query = db.leaveType.findOrCreate({
                            name: {
                                $regex: model.type.name, // leaveType name
                                $options: 'i'
                            },
                            organization: req.context.organization
                        }, {
                            name: model.type.name,
                            organization: req.context.organization,
                            unitsPerDay: 0
                        })
                    }
                    if (model.type.id) {
                        query = db.leaveType.findById(model.type.id) // leaveType id
                    }

                    return query
                        .then(leaveType => {
                            data.leaveType = leaveType.result || leaveType
                            return { leaveType: leaveType.result || leaveType, employee: employee }
                        })
                })
                .then(data => {
                    return db.leaveBalance.findOrCreate({
                        leaveType: data.leaveType,
                        employee: data.employee
                    }, {
                        leaveType: data.leaveType,
                        employee: data.employee,
                        units: 0,
                        unitsAvailed: 0
                    })
                        .then(leaveBalance => {
                            leaveBalance.result.leaveType = data.leaveType
                            return resolve(leaveBalance.result)
                        })
                })
                .catch(err => {
                    return reject(err)
                })
        })

        return getleaveBalance
            .then(leaveBalance => {
                if (!leaveBalance) {
                    throw ('no leave balance found')
                }
                if (!leaveBalance.leaveType.unlimited) {
                    let unitsInLT = leaveBalance.leaveType.unitsPerDay

                    if (data.days % 1 === 0) {
                        data.units = data.days * unitsInLT // for integer
                    } else {
                        data.units = Math.ceil(data.days * unitsInLT) // for float
                    }
                } else {
                    data.units = data.days
                }

                if (!leaveBalance.leaveType.unlimited && leaveBalance.units < data.units) {
                    throw ('you have insufficient balance to apply leave')
                }

                return leaveValidator(data.employee, data)
                    .then(result => {
                        if (result && result.status === 'submitted' && data.days === 1) {
                            throw ('You have already applied leave on this Date')
                        }

                        if (result && (result.status === 'rejected' || result.status === 'submitted')) {
                            result.status = 'submitted'
                            result.date = data.date
                            result.units = data.units
                            return result.save()
                        } else {
                            return new db.leave(data).save()
                        }
                    })
                    .then(leave => {
                        data.leaveType = leaveBalance.leaveType
                        leave.days = data.days
                        return { leaveBalance: leaveBalance, leave: leave }
                    })
            })
            .then(data => {
                if (data.leaveBalance.leaveType.unlimited) { // not Duduct Bal from Unlimited
                    return data.leave
                }

                data.leaveBalance.units = data.leaveBalance.units - data.leave.units
                return data.leaveBalance.save().then(() => data.leave)
            })
            .then(leave => {
                if (!req.employee.supervisor) {
                    logger.info(`${req.employee.name} - supervisor not found .So, notifing Reporties`)
                }

                data.leaveId = leave.id

                let task = {
                    type: 'leave',
                    id: leave.id,
                    actions: ['approve', 'reject']
                }

                // send-notification-to-supervisor
                req.context.processSync = true
                return offline.queue('leave', 'submit', { id: leave.id, bot: data.bot }, req.context)
            })
    })
        .then(() => {
            res.success('leaves applied successfully')
        }).catch(err => res.failure(err))
}

exports.get = (req, res) => {
    let query = {
        _id: req.params.id
    }

    db.leave.findOne(query).populate('leaveType')
        .then(leave => {
            leave.days = leave.units / leave.leaveType.unitsPerDay
            res.data(mapper.toModel(leave))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.search = (req, res) => {
    let query = {
        employee: req.employee.id,
        date: { $lte: moment()._d }
    }
    if (req.query.status) {
        query.status = {
            $in: [req.query.status]
        }
    } else {
        query.status = {
            $in: ['approved', 'rejected']
        }
    }

    let pendingLeaves = db.leave.find({
        employee: req.employee.id,
        status: 'submitted'
    }).populate('leaveType').sort({ date: -1 })

    let upcomingLeaves = db.leave.find({
        employee: req.employee.id,
        status: 'approved',
        date: {
            $gt: moment()._d
        }
    }).populate('leaveType').sort({ date: -1 })

    let leavesHistory = db.leave.find(query)
        .populate('leaveType')
        .sort({ date: -1 })

    Promise.all([pendingLeaves, upcomingLeaves, leavesHistory])
        .spread((pendingLeaves, upcomingLeaves, leavesHistory) => {
            var leaveData = {}
            let pendingLeaveItems = mapper.toSearchModel(pendingLeaves)

            let upcomingLeaveItems = mapper.toSearchModel(upcomingLeaves)

            let leavesHistoryItems = mapper.toSearchModel(leavesHistory)
            leaveData.pendingLeaveItems = pendingLeaveItems
            leaveData.upcomingLeaveItems = upcomingLeaveItems
            leaveData.leavesHistoryItems = leavesHistoryItems

            res.data(leaveData)
        })
}

exports.delete = (req, res) => {
    let query = {
        _id: req.params.id
    }

    db.leave.findOne(query)
        .then(leave => {
            return db.leaveBalance.findOne({
                employee: req.employee,
                leaveType: leave.leaveType
            })
                .then(leaveBalance => {
                    leaveBalance.units = leaveBalance.units + leave.units
                    leaveBalance.save()
                })
        })
        .then(() => db.leave.remove(query))
        .then(() => res.success('leave deleted successfully'))
        .catch(err => res.failure(err))
}

exports.update = (req, res) => {
    let model = req.body

    let updateData = {
        date: model.date,
        isPlanned: model.isPlanned,
        reason: model.reason,
        comment: model.comment,
        employee: req.employee
    }

    let query = {
        _id: req.params.id
    }

    db.leave.findOne(query)
        .then(leave => {
            leave = updationScheme.update(updateData, leave)
            return leave
        })
        .then(leave => {
            if (!model.days) {
                return leave
            }
            return db.leaveBalance.findOne({
                employee: req.employee,
                leaveType: leave.leaveType
            })
                .populate('leaveType')
                .then(leaveBalance => {
                    let unitsInLT = leaveBalance.leaveType.unitsPerDay
                    let latestUnits
                    if (model.days % 1 === 0) {
                        latestUnits = model.days * unitsInLT // for integer
                    } else {
                        latestUnits = Math.ceil(model.days * unitsInLT) // for float
                    }

                    if (leaveBalance.units < model.units) {
                        throw ('you can not apply leave')
                    }

                    leaveBalance.units = (leaveBalance.units + leave.units) - latestUnits
                    leave.units = latestUnits
                    return leaveBalance.save().then(() => leave)
                })
        })
        .then(leave => {
            return leave.save()
        })
        .then((leave) => {
            leave.days = model.days
            res.data(mapper.toModel(leave))
        })
        .catch(err => res.failure(err))
}

exports.actionOnLeave = (req, res) => {
    let model = req.body
    let context = req.context
    let leaveId = req.params.id
    let data = {
        status: model.status, // 'approved', 'cancelled', 'rejected'
        comment: model.comment
    }

    db.leave.findOne({ _id: leaveId })
        .populate('leaveType')
        .populate({
            model: 'employee',
            path: 'employee',
            populate: {
                model: 'shiftType',
                path: 'shiftType'
            }
        })
        .then(leave => {
            if (leave.status === data.status) {
                throw `status is already ${leave.status}`
            }
            leave.status = data.status
            leave.comment = data.comment
            return leave.save()
        })
        .then(leave => {
            res.data(mapper.toModel(leave))
            return leave
        })
        .then(leave => {
            if ((leave.status !== 'rejected') && (leave.status !== 'cancelled')) {
                return leave
            }

            if (leave.leaveType.unlimited) {
                return leave
            }
            return db.leaveBalance.findOne({
                employee: leave.employee,
                leaveType: leave.leaveType
            })
                .then(leaveBalance => {
                    leaveBalance.units = leaveBalance.units + leave.units
                    return leaveBalance.save()
                        .then(() => leave)
                })
                .catch(err => {
                    throw err
                })
        })
        .then(leave => {
            if (leave.status !== 'approved') {
                return leave
            }
            return onApproved(leave)
        })
        .then(leave => {
            if (leave.status === 'approved' || leave.status === 'rejected' || leave.status === 'cancelled') {
                let action
                switch (leave.status) {
                case 'approved':
                    action = 'approve'
                    break
                case 'rejected':
                    action = 'reject'
                    break
                case 'cancelled':
                    action = 'cancel'
                    break
                default:
                    break
                }

                context.processSync = true
                return offline.queue('leave', action, { id: leave.id }, context)
                    .then(() => {
                        // status change to seen on supervisor profile
                        return configureNotification(leave.employee.supervisor, leaveId)
                        // no task will be present when performing an actions
                    })
            }
        })
        .catch(err => res.failure(err))
}

exports.myTeamLeaves = (req, res) => {
    var me = req.employee.id
    var myTeamLeaves = []
    async.waterfall([
        function (cb) {
            db.team.find({ supervisor: me, employee: { $exists: true } }, function (err, team) {
                if (err) {
                    return cb(err)
                }
                cb(null, _.pluck(team, 'employee'))
            })
        },
        function (employees, cb) {
            async.each(employees, function (employee, callme) {
                db.leave.find({
                    employee: employee,
                    status: { $eq: 'submitted' }
                })
                    .populate({
                        path: 'leaveType',
                        select: 'unitsPerDay'
                    })
                    .populate({
                        path: 'employee',
                        select: 'name picData picUrl'
                    })
                    .exec((err, leaves) => {
                        if (err) {
                            return cb(err)
                        }
                        myTeamLeaves.push(leaves)
                        callme(null)
                    })
            }, function (err) {
                if (err) {
                    return cb(err)
                }
                cb(err, _.flatten(myTeamLeaves))
            })
        }
    ], function (err, myTeamLeaves) {
        if (err) {
            return res.failure(err)
        }
        res.page(mapper.toSearchModel(myTeamLeaves))
    })
}

exports.organizationLeaves = (req, res) => {
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)

    let leaveQuery = {}

    let query = {
        organization: req.context.organization.id,
        name: {
            $exists: true
        }
    }

    if (req.query.name) {
        query.name.$regex = req.query.name
        query.name.$options = 'i'
    }

    if (req.query.employeeId) {
        query._id = req.query.employeeId
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query.tags = { $in: tagIds }
    }

    if (req.query.leaveType) {
        leaveQuery.leaveType = req.query.leaveType
    }

    if (req.query.date) {
        let fromDate = moment(req.query.date).startOf('month')

        let toDate = moment(req.query.date).endOf('month')
        leaveQuery.date = {
            $gte: fromDate,
            $lt: toDate
        }
    }

    if (req.query.status) {
        leaveQuery.status = req.query.status
    }

    db.employee.find(query)
        .select('_id')
        .then(employees => {
            let employeeIds = _.pluck(employees, '_id')
            leaveQuery.employee = {
                $in: employeeIds
            }

            return Promise.all([
                db.leave.find(leaveQuery).count(),
                db.leave.find(leaveQuery).sort({ date: -1 })
                    .populate('leaveType')
                    .populate({
                        path: 'employee',
                        select: 'name code'
                    })
                    .skip(fromPage).limit(pageLmt)
            ])
                .spread((totalRecordsCount, leaves) => {
                    return { leaves: leaves, totalRecordsCount: totalRecordsCount }
                })
        })
        .then(data => {
            res.page(mapper.toSearchModel(data.leaves), pageLmt, PageNo, data.totalRecordsCount || 0)
        })
        .catch(err => {
            res.failure(err)
        })
}
