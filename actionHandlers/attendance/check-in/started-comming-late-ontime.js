'use strict'
let communications = require('../../../services/communications')
var moment = require('moment')
var entities = require('../../../helpers/entities')
var math = require('mathjs')
const db = require('../../../models')

let getDataForSTD = (items) => {
    // get data for standard deviation
    let lateData = []

    let onTimeData = []
    items.forEach(item => {
        let startTime = moment(item.shift.shiftType.startTime)

        let shiftStartTime = moment(item.shift.date)
            .set('hour', startTime.hour())
            .set('minute', startTime.minute())
            .set('second', startTime.second())
            .set('millisecond', 0)
        let shiftCheckIn = moment(item.checkIn)

        if (shiftCheckIn > shiftStartTime) { lateData.push(shiftCheckIn.diff(shiftStartTime, 'minutes')) }
        if (shiftCheckIn <= shiftStartTime) { onTimeData.push(shiftStartTime.diff(shiftCheckIn, 'minutes')) }
        return {
            lateData: lateData,
            onTimeData: onTimeData
        }
    })
}

exports.process = async (attendance, alert, context) => {
    let supervisorLevel = 1
    let channels = ['push']
    let triggerOn = 'endOfMonth'
    let minutes = 120

    if (alert.config.trigger) {
        triggerOn = alert.config.trigger.triggerOn || triggerOn
        minutes = alert.config.trigger.minutes || minutes
    }

    switch (triggerOn) {
    case 'endOfMonth':
        if (!moment().startOf('day').isSame(moment().endOf('month'), 'day')) { return null }
        break
    case 'midOfMonth':
        if (!moment().startOf('day').isSame(moment().startOf('month').add(14, 'day'), 'day')) { return null }
        break
    case 'daily':
        if (!moment().startOf('day').isSame(moment().startOf('day'), 'day')) { return null }
        break
    default:
        if (!moment().startOf('day').isSame(moment().endOf('month'), 'day')) { return null }
        break
    };

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    let lastMonthDeviation

    let getMonthSummary = (date) => {
        return db.monthSummary.findOne({
            weekStart: {
                $gte: date.startOf('month').toDate()
            },
            weekEnd: {
                $lte: date.endOf('month').toDate()
            },
            employee: attendance.employee.id
        })
    }

    let summmary = getMonthSummary(moment().startOf('month').subtract(1, 'month'))
    lastMonthDeviation = summmary.standardDeviation || 0
    summmary = getMonthSummary(moment().startOf('month'))

    let currentMonthDeviation = summmary.standardDeviation || 0

    let diff = currentMonthDeviation - lastMonthDeviation

    if ((math.sign(diff) === -1 && diff < -minutes) || (math.sign(diff) === 1 && diff > minutes)) {
        return communications.send({
            employee: attendance.employee,
            level: supervisorLevel
        }, {
            actions: [],
            entity: entities.toEntity(attendance, 'attendance'),
            data: {
                status: (alert.config.signOfDiff === 1 && diff > minutes) ? 'late' : 'on time',
                name: attendance.employee.name || attendance.employee.code
            },
            template: 'started-comming-late-ontime'
        }, channels, context)
    }
}
