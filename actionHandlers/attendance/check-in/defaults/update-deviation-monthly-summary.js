'use strict'
const _ = require('underscore')
const moment = require('moment')
const math = require('mathjs')
const db = require('../../../../models')

let getDataForSTD = (items) => {
    // get data for standard deviation
    let data = []
    items.forEach(item => {
        let startTime = moment(item.shift.shiftType.startTime)
        let shiftStartTime = moment(item.shift.date)
            .set('hour', startTime.hour())
            .set('minute', startTime.minute())
            .set('second', startTime.second())
            .set('millisecond', 0)
        let shiftCheckIn = moment(item.checkIn)
        data.push(shiftStartTime.diff(shiftCheckIn, 'minutes'))
    })
    return data
}

exports.process = async (attendance, context) => {
    const attendances = await db.attendance.find({
        employee: attendance.employee.id,
        checkIn: {
            $exists: true,
            $gte: moment(attendance.shift.date).startOf('month').toDate()
        }
    }).populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    const monthSummary = await db.monthSummary.findOne({
        weekStart: {
            $gte: moment(attendance.shift.date).startOf('month').toDate()
        },
        weekEnd: {
            $lte: moment(attendance.shift.date).endOf('month').toDate()
        },
        employee: attendance.employee
    })

    monthSummary.standardDeviation = math.std(getDataForSTD(attendances), 'uncorrected')
    await monthSummary.save()
}
