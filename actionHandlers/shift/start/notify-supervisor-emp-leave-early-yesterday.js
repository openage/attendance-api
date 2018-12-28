'use strict'
const moment = require('moment')
const _ = require('underscore')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.submit.handlers.send-notification-to-supervisor')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    logger.info(`notify-supervisor-emp-leave-early-yesterday has been triggered`)

    let supervisorLevel = 0
    let noOfPercentage = 2
    let earlyByMinutes = 2
    let channels = ['push']
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    if (alert.config.trigger) {
        noOfPercentage = alert.config.trigger.noOfPercentage || noOfPercentage
        earlyByMinutes = alert.config.trigger.earlyByMinutes || earlyByMinutes
    }

    db.team.find({
        supervisor: employeeId,
        employee: { $exists: true }
    }).populate('supervisor').then(team => {
        let ids = []
        if (!team) { return null }

        _.each(team, (item) => {
            ids.push(item.employee)
        })
        db.attendance.find({
            employee: { $in: ids },
            checkOut: {
                $exists: true,
                $gte: moment().startOf('day').subtract(1, 'day').toDate(),
                $lt: moment().endOf('day').subtract(1, 'day').toDate()
            }
        }).populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        }).then(attendances => {
            if (!attendances || (attendances && attendances.length == 0)) { return null }

            let shift = attendances[0].shift
            let endTime = moment(shift.shiftType.endTime)
            let shiftEndTime = moment(shift.date)
                .set('hour', endTime.hour())
                .set('minute', endTime.minute())
                .set('second', endTime.second())
                .set('millisecond', 0)
            let goingEarlyEmps = _.filter(attendances, (item) => {
                return moment(item.checkOut) < shiftEndTime && shiftEndTime.diff(moment(item.checkOut), 'minutes') >= earlyByMinutes
            })

            if (!goingEarlyEmps || (goingEarlyEmps && goingEarlyEmps.length == 0)) { return null }

            let percentageLate = ((goingEarlyEmps.length / attendances.length) * 100).toFixed(2)

            if (percentageLate < noOfPercentage) { return null }

            return communications.send({
                employee: team[0].supervisor,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(team[0].supervisor, 'employee'),
                data: {
                    phone: team[0].supervisor.phone || null,
                    employee: team[0].supervisor,
                    percentageLate: percentageLate
                },
                template: 'emp-leave-early-yesterday'
            }, channels, context)
        }).catch(err => console.log(err))
    }).catch(err => {
        {
            logger.info(`err on trigger alert trigger notify-supervisor-emp-leave-early-yesterday alert`)
            logger.error(err)
        }
    })
}
