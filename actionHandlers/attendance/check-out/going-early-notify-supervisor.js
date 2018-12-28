'use strict'
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')('going-early-notify-supervisor')
const moment = require('moment')
const entities = require('../../../helpers/entities')
const insights = require('../../../services/insights')
const db = require('../../../models')

const isEarly = (attendance, limit) => {
    if (!attendance.checkOut) {
        return true
    }

    let endTime = moment(attendance.shift.shiftType.endTime)

    let shiftEndTime = moment(attendance.shift.date)
        .set('hour', endTime.hour())
        .set('minute', endTime.minute())
        .set('second', endTime.second())
        .set('millisecond', 0)

    let shiftCheckOut = moment(attendance.checkOut)

    return shiftEndTime.diff(shiftCheckOut, 'minutes') > limit
}

exports.process = async (data, alert, context) => {
    logger.debug('early going alert has been triggered')
    let consecutive = true
    let threshold = 5
    let supervisorLevel = 1
    let channels = ['push']
    let inLastDays = 30

    let earlyByMinutes = 30
    if (alert.config.trigger) {
        consecutive = alert.config.trigger.inARow !== undefined ? !!((alert.config.trigger.inARow === 'yes' || alert.config.trigger.inARow === 'true' || alert.config.trigger.inARow === true)) : true
        threshold = alert.config.trigger.noOfTime
        earlyByMinutes = alert.config.trigger.noOfMin
    }

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    return db.attendance.findById(data.id).populate('employee').then(attendance => {
        return db.attendance.find({
            employee: attendance.employee.id,
            checkOut: {
                $exists: true,
                $gte: moment().subtract(inLastDays, 'days').toDate()
            }
        }).populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        }).then(async (attendances) => {
            if (!attendances || !attendances.length) {
                return null
            }

            let earlyAttendances = attendances.filter(item => {
                return isEarly(item, earlyByMinutes)
            }).sort((a, b) => {
                return a.shift.date - b.shift.date
            })

            if (earlyAttendances.length < threshold) {
                return null
            }

            if (!consecutive) {
                await insights.supervisorStats(alert, attendance.employee.id, 'noOfMin')
                return communications.send({
                    employee: attendance.employee,
                    level: supervisorLevel
                }, {
                    actions: [],
                    entity: entities.toEntity(attendance, 'attendance'),
                    data: {
                        checkOut: attendance.checkOut,
                        count: earlyAttendances.length,
                        minutes: earlyByMinutes,
                        days: inLastDays,
                        name: attendance.employee.name || attendance.employee.code
                    },
                    template: 'regularly-going-early'
                }, channels, context)
            }

            let consecutiveCount = 0
            let last = null

            earlyAttendances.forEach(item => {
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
                return null
            }
            await insights.supervisorStats(alert, attendance.employee, 'inARow')
            return communications.send({
                employee: attendance.employee,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(attendance, 'attendance'),
                data: {
                    checkOut: attendance.checkOut,
                    name: attendance.employee.name || attendance.employee.code,
                    times: consecutiveCount,
                    days: inLastDays,
                    count: earlyAttendances.length,
                    minutes: earlyByMinutes
                },
                template: 'consecutively-going-early'
            }, channels, context)
        })
    })
}
