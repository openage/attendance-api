'use strict'
const moment = require('moment')
const async = require('async')

const leaveTypes = require('./leave-types')
const leaveBalances = require('./leave-balances')

const dates = require('../helpers/dates')
const offline = require('@open-age/offline-processor')
const db = require('../models')

const employeeService = require('./employees')

exports.create = async (model, context) => {
    let log = context.logger.start('services/leaves:create')
    let fromDate = dates.date(model.date).bod()
    let toDate

    let start = model.start || {
        first: true,
        second: true
    }

    if (model.days && model.days < 1 && (start.first && start.second)) {
        start.second = false
    }

    let end = model.end || {
        first: true,
        second: true
    }

    if (model.toDate) {
        toDate = dates.date(model.toDate).eod()
    } else if (model.days && model.days > 1) {
        toDate = dates.date(fromDate).eod({ add: model.days - 1 })
    } else {
        toDate = dates.date(fromDate).eod()
    }

    if (!model.employee) {
        model.employee = {
            id: context.employee.id
        }
    }
    let employee = await employeeService.get(model.employee, context)

    if (!employee) {
        throw new Error('employee not found')
    }

    let existingLeaves = await db.leave.find({
        employee: employee,
        date: {
            $gte: fromDate
        },
        toDate: {
            $lte: toDate
        },
        status: {
            $in: ['approved', 'submitted']
        }
    })

    if (existingLeaves && existingLeaves.length) {
        throw new Error(`leaves exists between ${dates.date(fromDate).toString()} and ${dates.date(toDate).toString()}`)
    }

    let status = model.status || 'submitted'
    if (!employee.supervisor ||
        (employee.supervisor && employee.supervisor.status !== 'active')) {
        status = 'approved'
    }

    if (context.hasPermission(['admin', 'superadmin']) && employee.id !== context.employee.id) {
        log.info(`approving the leave as it is by admin`)
        status = 'approved'
    }

    let leaveType = await leaveTypes.get((model.type || model.leaveType), context)
    if (!leaveType) {
        throw new Error(`LeaveType not Exists`)
    }

    let leaveBalance = await leaveBalances.get({
        employee: employee,
        leaveType: leaveType
    }, context)

    if (!leaveBalance) {
        throw new Error('leave balance not found')
    }

    if (!model.days) {
        if (dates.date(toDate).isSame(fromDate)) {
            model.days = 1
            if (!start.first || !start.second) {
                model.days = model.days - 1 / leaveType.unitsPerDay
            }
        } else {
            model.days = dates.date(toDate).diff(fromDate) + 1
            if (!start.first) {
                model.days = model.days - 1 / leaveType.unitsPerDay
            }

            if (!end.second) {
                model.days = model.days - 1 / leaveType.unitsPerDay
            }
        }
    }

    let units = model.days

    if (!leaveType.unlimited) {
        units = (model.days % 1 === 0)
            ? model.days * leaveType.unitsPerDay
            : Math.ceil(model.days * leaveType.unitsPerDay) // for float

        if (leaveBalance.units < units) {
            throw new Error('insufficient balance to apply this leave')
        }

        leaveBalance.units = leaveBalance.units - units

        await leaveBalance.save()
    }

    let leave = await (new db.leave({
        date: fromDate,
        toDate: toDate,
        days: model.days,
        start: start,
        end: end,
        units: units,
        status: status,
        employee: employee,
        leaveType: leaveType,
        bot: model.bot,
        isPlanned: fromDate > new Date(),
        reason: model.reason,
        Ext_id: model.externalId,
        organization: context.organization
    }).save())

    if (leave.status === 'approved') {
        await offline.queue('leave', 'approve', {
            id: leave.id,
            bot: model.bot
        }, context)
    } else {
        await offline.queue('leave', 'submit', {
            id: leave.id,
            bot: model.bot
        }, context)
    }

    return leave
}

exports.getByDate = async (date, employee, context) => {
    employee = await employeeService.get(employee, context)
    date = dates.date(date).bod()

    let leaves = await db.leave.find({
        employee: employee,
        status: 'approved',
        date: {
            $lte: date
        },
        toDate: {
            $gte: date
        }
    }).populate('leaveType')

    return leaves
}

exports.getDaySummary = (leaves, date, context) => {
    let leaveSummary = {
        first: false,
        second: false,
        code: '',
        days: 0,
        reason: ''
    }

    if (!leaves || !leaves.length) {
        return leaveSummary
    }

    leaves.forEach(leave => {
        let onLeave = (!leave.toDate && dates.date(date).isSame(leave.date)) ||
            (leave.toDate && dates.date(date).isBetween(leave.date, leave.toDate))
        if (onLeave) {
            if (dates.date(date).isSame(leave.date) && leave.start && leave.start.first !== undefined) {
                leaveSummary.first = leave.start.first
                leaveSummary.second = leave.start.second
            } else if (dates.date(date).isSame(leave.toDate) && leave.end && leave.end.first !== undefined) {
                leaveSummary.first = leave.end.first
                leaveSummary.second = leave.end.second
            } else {
                leaveSummary.first = true
                leaveSummary.second = true
            }
            leaveSummary.code = leave.leaveType.code
            leaveSummary.days = leave.days
            leaveSummary.reason = leave.reason
        }
    })

    return leaveSummary
}
exports.notTakenLeave = (supervisorId, date, lastDays) => {
    return new Promise((resolve, reject) => {
        db.team.find({
            supervisor: supervisorId,
            employee: {
                $exists: true
            }
        }).populate('supervisor employee').then(teams => {
            let employees = []
            if (!teams) {
                return resolve(null)
            }

            async.eachSeries(teams, (team, next) => {
                if (!team.employee) {
                    return next()
                }
                db.leave.find({
                    employee: team.employee.id,
                    $or: [{
                        date: {
                            $exists: true,
                            $gte: date.startOf('day').subtract(lastDays, 'day').toDate(),
                            $lt: date.endOf('day').toDate()
                        }
                    }, {
                        toDate: {
                            $exists: true,
                            $gte: moment().startOf('day').subtract(lastDays, 'day').toDate(),
                            $lt: moment().endOf('day').toDate()
                        }
                    }]
                }).then(leaves => {
                    if (!leaves || (leaves && leaves.length == 0)) {
                        employees.push(team.employee)
                    }
                    next()
                }).catch()
            }, (err) => {
                let totalEmps = employees.length
                if (totalEmps == 0) return resolve(null)
                return resolve({
                    totalEmps: employees.length,
                    supervisor: teams[0].supervisor,
                    employees: employees,
                    lastDays: lastDays
                })
            })
        }).catch(err => {
            reject(err)
        })
    })
}
