'use strict'
const entities = require('../../../helpers/entities')
const leaveKinds = require('../../../helpers/leaveKinds')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.approve.notify-employee')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    let supervisorLevel = 0
    let channels = ['push']
    let leaveId = data.id
    let acceptedBy = context.employee

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    return db.leave.findById(leaveId)
        .populate('employee')
        .then(leave => {
            leave.leaveKind = leaveKinds.getLeaveKind(leave)

            return communications.send({
                employee: leave.employee,
                level: supervisorLevel
            }, {
                actions: ['leaveDetail'],
                entity: entities.toEntity(acceptedBy, 'employee'),
                data: {
                    leave: leave,
                    acceptedBy: acceptedBy
                },
                template: 'leave-accepted'
            }, channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert leave-accept`)
            logger.error(`${err}`)
        })
}
