'use strict'
const moment = require('moment')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')(
    'leave.submit.handlers.send-notification-to-supervisor'
)

const db = require('../../../models')

exports.process = (data, alert, context) => {
    logger.info(`notify-on-checkin has been triggered`)

    let supervisorLevel = 0
    let channels = ['push']
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    return db.employee.findOne({ _id: employeeId, dob: { $exists: true } })
        .populate('shiftType')
        .then(employee => {
            if (!employee) {
                return Promise.resolve(null)
            }
            if (!moment(employee.dob).startOf('day').isSame(moment().startOf('day'))) {
                return Promise.resolve(null)
            }
            return communications.send({
                employee: employee,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(employee, 'employee'),
                data: {
                    employee: employee.name.split(' ')[0]
                },
                template: 'bday-wish'
            },
            channels, context
            )
                .then(() => {
                    return Promise.resolve(null)
                })
        })
}
