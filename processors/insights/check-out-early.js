'use strict'

const logger = require('@open-age/logger')('processors/insight/checkout-early')
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

const getShiftEndTime = (employee) => {
    let endTime = moment(employee.shiftType.endTime)
    return moment().set('hour', endTime.hour())
        .set('minute', endTime.minute())
        .set('second', endTime.second())
        .set('millisecond', 0)
}

const isEarly = (attendance, limit) => {
    if (!attendance.checkOut) {
        return true
    }

    let endTime = moment(attendance.shift.shiftType.endTime)

    let shiftEndTime = moment(attendance.shift.date)
        .set('hour', endTime.hour())
        .set('minute', endTime.minute())
        .set('second', endTime.second())
        .set('millisecond', 0)._d

    let shiftCheckOut = moment(attendance.checkOut)._d

    return shiftEndTime.diff(shiftCheckOut, 'minutes') > limit
}

const getTeamEarlyCheckoutForMonth = async (team, date) => {
    return await Promise.all(team.map(async (employee) => {
        let shiftEndTime = getShiftEndTime(employee)
        return await db.attendance.find({
            employee: employee.id.toString(),
            checkOut: {
                $exists: true,
                $gte: moment(shiftEndTime).subtract(30, 'days').toDate()
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

    let teamMonthAttendance = await getTeamEarlyCheckoutForMonth(team, date)

    let earlyByMinutes = 0
    let consecutive = true
    let threshold = 0
    if (params && params.noofmin) {
        earlyByMinutes = params.noofmin
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
