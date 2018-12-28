'use strict'
const logger = require('@open-age/logger')('actionHandlers/checkIn/update-deviation-monthly-summary')
const _ = require('underscore')
const moment = require('moment')
const math = require('mathjs')
const db = require('../../../../models')

let getDataForSTD = (items) => {
    // get data for standard deviation
    let data = []
    _.each(items, (item) => {
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

exports.process = (data, context, callback) => {
    logger.start('process')
    return db.attendance.findById(data.id).populate('employee shift').then(attendance => {
        db.attendance.find({
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
        }).then(attendances => {
            db.monthSummary.findOne({
                weekStart: {
                    $gte: moment(attendance.shift.date).startOf('month').toDate()
                },
                weekEnd: {
                    $lte: moment(attendance.shift.date).endOf('month').toDate()
                },
                employee: attendance.employee
            }).then(monthSummary => {
                monthSummary.standardDeviation = math.std(getDataForSTD(attendances), 'uncorrected')
                monthSummary.save()
                return callback()
            })
        }).catch(err => {
            return callback()
        })
    })
}
