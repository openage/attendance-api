'use strict'
const offline = require('@open-age/offline-processor')
const dates = require('../helpers/dates')
const db = require('../models')

const getSummary = async (date, employee, context) => {
    let summary = await db.weekSummary.findOne({
        weekStart: dates.date(date).bom(),
        weekEnd: dates.date(date).eom(),
        employee: employee
    }).populate('attendances')

    if (summary) {
        return summary
    }
    summary = new db.weekSummary({
        weekStart: dates.date(date).bom(),
        weekEnd: dates.date(date).eom(),
        employee: employee
    })

    await summary.save()

    await offline.queue('weekSummary', 'create', {
        id: summary.id
    }, context)

    return summary
}
exports.getSummary = getSummary

exports.addAttendance = async (attendance, context) => {
    let summary = await getSummary(attendance.ofDate, attendance.employee, context)
    summary.attendances = summary.attendances || []
    summary.attendances.push(attendance)
    await summary.save()
    return summary
}

exports.update = async (date, employee, context) => {
    let summary = await getSummary(date, employee, context)
    let hoursWorked = 0
    let attendanceCount = 0

    summary.attendances.forEach((item) => {
        if (!isNaN(item.minsWorked)) {
            hoursWorked = hoursWorked + item.hoursWorked + (item.minsWorked / 60)
        }
        if ('onLeave|absent'.indexOf(item.status) === -1) {
            attendanceCount = attendanceCount + 1
        }
    })

    summary.hoursWorked = hoursWorked
    summary.attendanceCount = attendanceCount

    await summary.save()
    return summary
}
