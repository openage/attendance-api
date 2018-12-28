'use strict'
const async = require('async')
const moment = require('moment')
const logger = require('@open-age/logger')('handlers.leaves.leaveApprove')
const db = require('../../../../models')

exports.process = (data, context, callback) => {
    let leaveId = data.id
    logger.info('leave summary going to update ..')
    async.waterfall([
        cb => {
            db.leave.findById(leaveId, cb)
        },
        (leave, cb) => {
            let endOfMonth = moment(leave.date).startOf('month').add(1, 'month').subtract(1, 'millisecond')

            let startOfMonth = moment(leave.date).startOf('month')

            db.yearSummary.findOneOrCreate({
                endMonth: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                },
                employee: leave.employee
            }, {
                employee: leave.employee,
                endMonth: endOfMonth
            }, (err, monthData) => {
                if (err) {
                    return cb(err)
                }
                cb(null, leave, monthData)
            })
        },
        (leave, monthData, cb) => {
            monthData.leaves.push({
                leave: leave._id,
                date: leave.date,
                leaveTypeCategory: leave.leaveType.status
            })
            monthData.save(err => {
                if (err) {
                    return cb(err)
                }
                cb(null)
            })
        }
    ], err => {
        if (err) {
            return callback(err)
        }
        callback(null)
    })
}
