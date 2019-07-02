'use strict'
const communications = require('../../../services/communications')
const moment = require('moment')
const entities = require('../../../helpers/entities')
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

    return shiftCheckIn.diff(shiftStartTime, 'minutes') >= limit
}

exports.process = async (attendance, alert, context) => {
    let supervisorLevel = 0
    let channels = ['push']
    let noOfMinutes = 1

    if (alert.config.trigger) {
        noOfMinutes = alert.config.trigger.noOfMinutes
    }

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    const shift = await db.shift.findById(attendance.shift.id).populate('shiftType')
    attendance.shift = shift
    if (!isLate(attendance, noOfMinutes)) { return }

    await communications.send({
        employee: attendance.employee,
        level: supervisorLevel
    }, {
        actions: ['applyLeave'],
        entity: entities.toEntity(attendance, 'attendance'),
        data: {
            checkIn: attendance.checkIn,
            name: attendance.employee.name || attendance.employee.code
        },
        template: 'comming-late-apply-leave'
    }, channels, context)
}
