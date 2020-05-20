'use strict'
const leaveTypes = require('./leave-types')
const leaveBalances = require('./leave-balances')
const moment = require('moment')
const dates = require('../helpers/dates')
const offline = require('@open-age/offline-processor')
const db = require('../models')
const employeeService = require('./employees')
const employeeGetterService = require('./employee-getter')
const attendanceService = require('../services/attendances')

const populate = 'leaveType employee'

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
            id: context.user.id
        }
    }
    let employee = await employeeGetterService.get(model.employee, context)

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

    // status = "submitted"

    if (context.hasPermission(['organization.admin', 'organization.hr', 'admin', 'superadmin']) && employee.id !== context.user.id) {
        log.info(`approving the leave as it is by admin`)
        status = 'approved'
    }

    let leaveType = await leaveTypes.get((model.type || model.leaveType), context)
    if (!leaveType) {
        throw new Error(`Leave Type not Exists`)
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

    let leaveDays = model.days

    for (const leaveDate of dates.date(fromDate).dates(model.days)) {
        let attendance = await attendanceService.getAttendanceByDate(leaveDate, employee, { create: true }, context)
        if (attendance) {
            if (attendance.status !== 'absent') {
                leaveDays = leaveDays - 1
            }
        }
    }

    let units = leaveDays

    if (!leaveType.unlimited) {
        units = (leaveDays % 1 === 0)
            ? leaveDays * leaveType.unitsPerDay
            : Math.ceil(leaveDays * leaveType.unitsPerDay) // for float

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
        externalId: model.externalId,
        organization: context.organization,
        tenant: context.tenant
    }).save())

    if (leave.status === 'approved') {
        await offline.queue('leave', 'approve', leave, context)
    } else {
        await offline.queue('leave', 'submit', leave, context)
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

exports.getDaySummary = (leaves, date) => {
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

exports.get = async (query) => {
    if (typeof query === 'string' && query.isObjectId()) {
        return db.leave.findById(query).populate('leaveType')
    }

    if (query.id) {
        return db.leave.findById(query.id).populate('leaveType')
    }

    return
}

exports.search = async (query, pager, context) => {
    let where = {
        organization: context.organization
    }

    if (query.date) {
        let date = dates.date(query.date)
        if (query.from && query.till) {
            where.date = {
                $gte: dates.date(query.from).bod(),
                $lte: dates.date(query.till).eod()
            }
        } else {
            where.date = {
                $gte: date.bom(),
                $lte: date.eom()
            }
        }
    }

    if (!context.hasPermission(['organization.supervisor', 'organization.admin', 'organization.superadmin'])) {
        where.employee = context.user
    } else {
        let employeeQuery = {
            organization: context.organization
        }

        let filterEmployee = false

        if (!context.hasPermission(['organization.admin', 'organization.superadmin'])) {
            employeeQuery.supervisor = context.user
            filterEmployee = true
        } else if (query.supervisorId || query.supervisor) {
            employeeQuery.supervisor = await employeeGetterService.get(query.supervisorId || query.supervisor, context)
            filterEmployee = true
        }

        if (query.employeeId || query.employeeCode || query.employee || query.user) {
            let user = await employeeGetterService.get(query.employeeId || query.employeeCode || query.employee || query.user, context)

            if (user) {
                employeeQuery.id = user.id
            } else {
                return {
                    items: [],
                    count: 0
                }
            }

            filterEmployee = true
        }

        if (query.name) {
            employeeQuery.$or = [{
                'profile.firstName': {
                    $regex: query.name,
                    $options: 'i'
                }
            }, {
                'profile.lastName': {
                    $regex: query.name,
                    $options: 'i'
                }
            }]
            // employeeQuery.name = {
            //     $regex: query.name,
            //     $options: 'i'
            // }
            filterEmployee = true
        }

        if (filterEmployee) {
            if (employeeQuery.id) {
                where.employee = employeeQuery.id
            } else {
                where.employee = {
                    $in: await db.employee.find(employeeQuery).select('_id')
                }
            }
        }
    }

    if (query.status) {
        if (query.status.indexOf(',') > -1) {
            query.status = query.status.split(',')
        }
        where.status = {
            $in: query.status
        }
        // } else {
        //     where.status = 'approved'
    }

    if (query.leaveType) {
        where.leaveType = await leaveTypes.get(query.leaveType, context)
    }

    let total = await db.leave.find(where).count()
    let entities
    if (pager) {
        entities = await db.leave.find(where).skip(pager.skip).limit(pager.limit).populate(populate).sort({
            date: -1
        })
    } else {
        entities = await db.leave.find(where).populate(populate).sort({
            date: -1
        })
    }

    return {
        items: entities,
        count: total
    }
}

exports.remove = async (id, context) => {
    let leave = await db.leave.findById(id)
    let leaveBalance = await leaveBalances.get({
        employee: leave.employee,
        leaveType: leave.leaveType
    }, context)
    leaveBalance.units = leaveBalance.units + leave.units
    await leaveBalance.save()
    await db.leave.remove({ _id: id })
}

exports.update = async (id, model, context) => {
    let data = {
        status: model.status, // 'approved', 'cancelled', 'rejected'
        comment: model.comment
    }

    let leave = await db.leave.findById(id)
        .populate('leaveType')
        .populate({
            model: 'employee',
            path: 'employee',
            populate: {
                model: 'shiftType',
                path: 'shiftType'
            }
        })
    if (leave.status === data.status) {
        throw new Error(`status is already ${leave.status}`)
    }
    leave.status = data.status
    leave.comment = data.comment
    await leave.save()

    if (leave.status === 'rejected' || leave.status === 'cancelled') {
        let leaveBalance = await leaveBalances.get({
            employee: leave.employee,
            leaveType: leave.leaveType
        }, context)
        leaveBalance.units = leaveBalance.units + leave.units
        await leaveBalance.save()
    }

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
    offline.queue('leave', action, leave, context)
    return leave
}
