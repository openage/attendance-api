'use strict'

const logger = require('@open-age/logger')('check-in-late')
const insights = require('../../services/insights')
const moment = require('moment')
const _ = require('underscore')
const db = require('../../models')

const getTeam = (employee) => {
    return db.team.find({
        supervisor: employee,
        employee: { $exists: true }
    })
        .populate({
            path: 'employee',
            populate: {
                path: 'shiftType'
            }
        })
        .then(members => {
            return _.pluck(members, 'employee')
        })
}

const getShiftStartTime = (employee) => {
    let startTime = moment(employee.shiftType.startTime)
    return moment().set('hour', startTime.hour())
        .set('minute', startTime.minute())
        .set('second', startTime.second())
        .set('millisecond', 0)
}

const isEarly = (attendance, limit) => {
    if (!attendance.checkIn) {
        return false
    }

    let startTime = moment(attendance.shift.shiftType.startTime)

    let shiftStartTime = moment(attendance.shift.date)
        .set('hour', startTime.hour())
        .set('minute', startTime.minute())
        .set('second', startTime.second())
        .set('millisecond', 0)

    let shiftCheckIn = moment(attendance.checkIn)

    return shiftCheckIn.diff(shiftStartTime, 'minutes') > limit
}

const getTeamLateCheckInForMonth = async (team, date) => {
    return await Promise.all(team.map(async (employee) => {
        let startOfMonth = moment().startOf('month')
        return await db.attendance.find({
            employee: employee.id.toString(),
            checkIn: {
                $exists: true,
                $gte: startOfMonth.toDate()
            }
        })
            .populate({
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            })
            .then((attendances) => {
                employee.attendances = attendances
                return employee
            })
    }))
}

const getAndFilteringAttendances = async (team, params, date) => {
    logger.start('filteringAttendance')

    let teamMonthAttendance = await getTeamLateCheckInForMonth(team, date)

    let lateByMinutes = 0
    let consecutive = true
    let threshold = 0
    if (params && params.noofmin) {
        lateByMinutes = params.noofmin
    }
    if (params && params.nooftime) {
        threshold = params.nooftime
    }
    if (params && params.inarow) {
        consecutive = params.inarow !== undefined ? !!((params.inarow === 'yes' || params.inarow === 'true' || params.inarow === true)) : true
    }

    let requiredTeam = []

    await team.forEach(employee => {
        if (employee.attendances.length > 0) {
            if (consecutive) {
                let consecutiveCount = 0
                let last = null

                employee.attendances.forEach(item => {
                    if (!last) {
                        last = item
                        return
                    }

                    if (moment(last.shift.date).diff(moment(moment(last.shift.date)), 'days') < 2) {
                        consecutiveCount++
                    } else {
                        consecutiveCount = 0
                    }
                    last = item
                })

                if (consecutiveCount < threshold) {
                    return requiredTeam.push(employee)
                }
            }

            if (threshold) {
                if (employee.attendances.length < threshold) {
                    return requiredTeam.push(employee)
                }
            }

            return requiredTeam.push(employee)
        } else {

        }
    })

    return requiredTeam
}

exports.listQuery = async (supervisor, params, insight, date) => {
    logger.start('listQuery')

    let team = await getTeam(supervisor)

    let requiredTeam = await getAndFilteringAttendances(team, params, date)

    return requiredTeam
}

exports.generateReport = async (report) => {
    logger.start('generateFile')
    report.startedAt = new Date()
    let team = await getTeam(report.employee)

    let requiredTeam = await getAndFilteringAttendances(team, report.params, report.params.date)

    let csvHeaders = ['name', 'code']

    return await insights.createReport(report, csvHeaders, requiredTeam)
}
