'use strict'

const _ = require('underscore')
const moment = require('moment')
const teams = require('../services/teams')
const shifts = require('../services/shifts')
const shiftTypes = require('../services/shift-types')
const attendances = require('../services/attendances')
const db = require('../models')

class Today {
    constructor (startTime, endTime) {
        this.startTime = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        this.endTime = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    }
}

exports.get = async (employeeId, context) => {
    const log = context.logger.start('get')

    let employee = await db.employee.findById(employeeId).populate('shiftType organization')

    const insightQuery = {
        date: { $gte: new Today().startTime, $lt: new Today().endTime },
        employee: employeeId
    }

    const myShift = (await shifts.shiftByShiftType(employee.shiftType, new Date(), context)).result

    employee.attendance = (await attendances.findOrCreateAttendance(employee, myShift, new Today().startTime)).result

    employee.insightSummary = await db.insightSummary.findOne(insightQuery)
        .populate({
            path: 'my.insight',
            populate: {
                path: 'type'
            }
        })
        .populate({
            path: 'team.insight',
            populate: {
                path: 'type'
            }
        })

    employee.leaveBalances = await db.leaveBalance.find({ employee: employee }).populate('leaveType')

    employee.pendingLeaves = await db.leave.find({ employee: employee, status: 'submitted' }).populate('leaveType').sort({ date: -1 })

    employee.upcomingLeaves = await db.leave.find({ employee: employee, status: 'approved', date: { $gt: moment()._d } }).populate('leaveType').sort({ date: -1 })

    employee.effectiveShiftType = await shiftTypes.upComingEffectiveShift(employee.id.toString(), context)

    employee.absentDates = _.pluck(await db.attendance.find({
        employee: employeeId,
        ofDate: {
            $gte: moment().startOf('month').toISOString(),
            $lt: moment().endOf('month').toISOString()
        },
        status: 'absent'
    }).select('ofDate').sort({ 'ofDate': 1 }).lean(), 'ofDate')

    employee.team = await teams.getTeam(employee)

    const myTeamEmployeeIds = _.pluck(employee.team, '_id')

    const teamAttendanceQuery = {
        ofDate: { $gte: new Today().startTime, $lt: new Today().endTime },
        employee: {
            $in: myTeamEmployeeIds
        }
    }

    const teamInsightSummaryQuery = {
        date: { $gte: new Today().startTime, $lt: new Today().endTime },
        employee: {
            $in: myTeamEmployeeIds
        }
    }

    const myTeamLeveBalances = await db.leaveBalance.find({ employee: { $in: myTeamEmployeeIds } }).populate('leaveType')
    const myTeamPendingLeaves = await db.leave.find({ employee: { $in: myTeamEmployeeIds }, status: 'submitted' }).populate('leaveType').sort({ date: -1 })
    const myTeamUpcomingLeaves = await db.leave.find({ employee: { $in: myTeamEmployeeIds }, status: 'approved', date: { $gt: moment()._d } }).populate('leaveType').sort({ date: -1 })
    const myTeamAttendance = await db.attendance.find(teamAttendanceQuery)
    const myTeamInsightSummary = await db.insightSummary.find(teamInsightSummaryQuery)
        .populate({
            path: 'my.insight',
            populate: {
                path: 'type'
            }
        })
        .populate({
            path: 'team.insight',
            populate: {
                path: 'type'
            }
        })
    const myTeamAbsentDays = await db.attendance.find({
        employee: { $in: myTeamEmployeeIds },
        ofDate: {
            $gte: moment().startOf('month').toISOString(),
            $lt: moment().endOf('month').toISOString()
        },
        status: 'absent'
    }).sort({ 'ofDate': 1 }).lean()

    await Promise.each(employee.team, async (member) => {
        member.attendance = myTeamAttendance.find((memberAttendance) => {
            if (memberAttendance.employee.toString() === member._id.toString()) {
                return memberAttendance
            }
        })
        member.insightSummary = myTeamInsightSummary.find((memberInsightSummary) => {
            if (memberInsightSummary.employee.toString() === member._id.toString()) {
                return memberInsightSummary
            }
        })
        member.leaveBalances = myTeamLeveBalances.filter((memberleaveBalance) => {
            if (memberleaveBalance.employee.toString() === member._id.toString()) {
                return memberleaveBalance
            }
        })
        member.pendingLeaves = myTeamPendingLeaves.filter((memberPendingLeaves) => {
            if (memberPendingLeaves.employee.toString() === member._id.toString()) {
                return memberPendingLeaves
            }
        })
        member.upcomingLeaves = myTeamUpcomingLeaves.filter((memberUpcomingLeaves) => {
            if (memberUpcomingLeaves.employee.toString() === member._id.toString()) {
                return memberUpcomingLeaves
            }
        })
        member.absentDates = myTeamAbsentDays.filter((memberAbsentDates) => {
            if (memberAbsentDates.employee.toString() === member._id.toString()) {
                return memberAbsentDates
            }
        })
        member.absentDates = _.pluck(member.absentDates, 'ofDate')

        member.effectiveShiftType = await shiftTypes.upComingEffectiveShift(member._id.toString(), context)
    })
    return employee
}
