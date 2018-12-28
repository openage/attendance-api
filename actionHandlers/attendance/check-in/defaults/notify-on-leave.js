'use strict'
const async = require('async')
const moment = require('moment')
const communications = require('../../../../services/communications')
const entities = require('../../../../helpers/entities')
const db = require('../../../../models')
const logger = require('@open-age/logger')
('attendance.check-in.handlers.notify-supervisor-for-minutes-late-inRow')

exports.process = (data, context, callback) => {
    logger.info(`notify-on-leave has been triggered`)

    let supervisorLevel = 0
    let channels = ['push']
    let attendanceId = data.id
    let notifyTo

    async.waterfall([
        function (cb) {
            db.attendance.findById(attendanceId)
                .populate({
                    path: 'employee',
                    populate: {
                        path: 'supervisor'
                    }
                })
                .exec(cb)
        },
        function (attendance, cb) {
            db.leave.findOne({
                employee: attendance.employee.id.toString(),
                date: attendance.ofDate
            })
                .populate('employee')
                .exec(function (err, leave) {
                    if (err) {
                        return cb(err)
                    }
                    return cb(null, attendance, leave)
                })
        },
        function (attendance, leave, cb) {
            if (attendance.status !== 'onLeave') {
                logger.info(`today ${attendance.employee.name} was not on leave`)
                return callback(null)
            }
            attendance.status = 'checkedIn'
            attendance.save()
            notifyTo = attendance.employee
            if (attendance.employee.supervisor) {
                notifyTo = attendance.employee.supervisor
            }
            return communications.send({
                employee: notifyTo,
                level: supervisorLevel
            }, {
                actions: [
                    'cancel'
                ],
                entity: entities.toEntity(leave.employee, 'employee'),
                data: {
                    leave: leave,
                    employee: attendance.employee.name
                },
                template: 'cancel-leave-on-present'
            }, channels, context)
                .then(() => {
                    cb(null)
                })
                .catch(err => {
                    cb(err)
                })
        }
    ], function (err) {
        if (err) {
            logger.info(`err on trigger alert notify-on-leave`)
            logger.error(`${err}`)
        }
        callback(null)
    })
}
