'use strict'
const moment = require('moment')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const leaves = require('../../../services/leaves')
const logger = require('@open-age/logger')
('leave.submit.handlers.send-notification-to-supervisor')

exports.process = (data, alert, context) => {
    logger.info(`notify-supervisor-not-taken-leaves-since-long has been triggered`)

    let supervisorLevel = 0
    let triggerOn = 'startOfMonth'
    let lastDays = 30
    let channels = ['push']
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    if (alert.config.trigger) {
        triggerOn = alert.config.trigger.triggerOn || triggerOn
        lastDays = alert.config.trigger.lastDays || lastDays
    }

    switch (triggerOn) {
    case 'startOfMonth':
        if (!moment().startOf('day').isSame(moment().startOf('month'), 'day')) { return null }
        break
    case 'endOfMonth':
        if (!moment().startOf('day').isSame(moment().endOf('month'), 'day')) { return null }
        break
    case 'startOfWeek':
        if (!moment().startOf('day').isSame(moment().startOf('week'), 'day')) { return null }
        break
    case 'endOfWeek':
        if (!moment().startOf('day').isSame(moment().endOf('week'), 'day')) { return null }
        break
    case 'daily':
        break
    default:
        if (!moment().startOf('day').isSame(moment().startOf('month'), 'day')) { return null }
        break
    };

    leaves.notTakenLeave(employeeId, moment(), lastDays).then(result => {
        if (!result) { return null }
        let totalEmps = result.totalEmps
        if (totalEmps == 0) return null

        let entity = {
            id: result.supervisor.id,
            picData: result.supervisor.picData,
            picUrl: result.supervisor.picUrl,
            name: result.supervisor.name,
            lastDays: result.lastDays,
            date: new Date()
        }

        return communications.send({
            employee: result.supervisor,
            level: supervisorLevel
        }, {
            actions: ['noLeaveTaken'],
            entity: entities.toEntity(entity, 'noLeaveTaken'),
            data: {
                totalEmployees: totalEmps,
                employees: result.employees,
                employee: result.supervisor,
                lastDays: result.lastDays
            },
            template: 'not-taken-leave-since-long'
        }, channels, context)
    }).catch(err => {
        {
            logger.info(`err on trigger alert  triggernotify-supervisor-not-taken-leaves-since-long alert`)
            logger.error(err)
        }
    })
}
