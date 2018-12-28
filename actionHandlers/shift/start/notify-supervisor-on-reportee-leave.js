'use strict'
const moment = require('moment')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.submit.handlers.send-notification-to-supervisor')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    logger.info(`notify-supervisor-on-reportee-leave-alert has been triggered`)

    let supervisorLevel = 1
    let letMeKnowBeforeDays = 1
    let channels = ['push']
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    if (alert.config.trigger) {
        letMeKnowBeforeDays = alert.config.trigger.letMeKnowBeforeDays || letMeKnowBeforeDays
    }

    let date = moment().add(letMeKnowBeforeDays, 'days')

    return db.employee.findById(employeeId)
        .then(employee => {
            return db.attendance.findOne({
                employee: employee,
                ofDate: {
                    $gte: date.startOf('day').toDate(),
                    $lt: date.endOf('day').toDate()
                },
                status: /onLeave/
            }).then(attendance => { return { attendance: attendance, employee: employee } })
        })
        .then(data => {
            if (!data.attendance) {
                return Promise.resolve(null)
            }

            return communications.send({
                employee: data.employee,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(data.employee, 'employee'),
                data: {
                    employee: data.employee,
                    leaveDate: date
                },
                template: 'reportee-on-leave'
            }, channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert trigger notify-supervisor-on-reportee-leave alert`)
            logger.error(err)
        })
}
