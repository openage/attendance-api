'use strict'
const communications = require('../../../services/communications')
const insights = require('../../../services/insights')
const moment = require('moment')
const entities = require('../../../helpers/entities')
const logger = require('@open-age/logger')('coming-late-notify-supervisor')
const db = require('../../../models')
const isLate = (attendance, limit) => {
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

exports.process = async (attendance, alert, context) => {
    logger.start('process')
    let consecutive = true
    let threshold = 5
    let supervisorLevel = 1
    let channels = ['push']
    let inLastDays = 30

    let lateByMinutes = 30
    if (alert.config.trigger) {
        consecutive =
            alert.config.trigger.inARow !== undefined ? !!((alert.config.trigger.inARow === 'yes' || alert.config.trigger.inARow === 'true' || alert.config.trigger.inARow === true)) : true
        threshold = alert.config.trigger.noOfTime ? alert.config.trigger.noOfTime : threshold
        lateByMinutes = alert.config.trigger.noOfMin ? alert.config.trigger.noOfMin : lateByMinutes
    }

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    let startOfMonth = moment().startOf('month')

    let attendances = await db.attendance.find({
        employee: attendance.employee.id,
        checkIn: {
            $exists: true,
            $gte: startOfMonth.toDate()
        }
    }).populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    if (!attendances || !attendances.length) {
        return null
    }

    // today Late

    let todayAttendance = attendances.find(item => {
        return moment(attendance.checkIn).isSame(moment(item.checkIn), 'day')
    })

    // if not same day
    if (!moment(attendance.checkIn).isSame(moment(), 'day')) { return }

    let startTime = moment(todayAttendance.shift.shiftType.startTime)
    let shiftStartTime = moment(todayAttendance.shift.date)
        .set('hour', startTime.hour())
        .set('minute', startTime.minute())
        .set('second', startTime.second())
        .set('millisecond', 0)
    attendance.shift = todayAttendance.shift
    if (isLate(attendance, lateByMinutes)) {
        await insights.supervisorStats(alert, attendance.employee.id, 'noOfMin')
        await communications.send({
            employee: attendance.employee,
            level: supervisorLevel
        }, {
            actions: [],
            entity: entities.toEntity(attendance, 'attendance'),
            data: {
                checkIn: attendance.checkIn,
                name: attendance.employee.name || attendance.employee.code,
                minutes: moment(attendance.checkIn).diff(shiftStartTime, 'minutes')
            },
            template: 'consecutively-comming-late'
        }, channels, context)
    }

    // regularly-comming-late

    let lateAttendances = attendances.filter(item => {
        return isLate(item, lateByMinutes)
    }).sort((a, b) => {
        return a.shift.date - b.shift.date
    })

    if (lateAttendances.length < threshold) { return }
    if (!consecutive) { return }

    inLastDays = moment().diff(startOfMonth, 'days')

    await insights.supervisorStats(alert, attendance.employee, 'inARow')
    await communications.send({
        employee: attendance.employee,
        level: supervisorLevel
    }, {
        actions: [],
        entity: entities.toEntity(attendance, 'attendance'),
        data: {
            checkIn: attendance.checkIn,
            count: lateAttendances.length,
            minutes: lateByMinutes,
            days: inLastDays,
            name: attendance.employee.name || attendance.employee.code
        },
        template: 'regularly-comming-late'
    }, channels, context)
}
