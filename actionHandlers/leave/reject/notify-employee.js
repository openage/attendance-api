'use strict'
var entities = require('../../../helpers/entities')
var leaveKinds = require('../../../helpers/leaveKinds')
let communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.reject.notify-employee')

const db = require('../../../models')

exports.process = (data, alert, context) => {
    let supervisorLevel = 0
    let channels = ['push']
    let leaveId = data.id
    let rejectedBy = context.employee

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
                entity: entities.toEntity(rejectedBy, 'employee'),
                data: {
                    leave: leave,
                    rejectedBy: rejectedBy
                },
                template: 'leave-rejection'
            }, channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert leave-reject`)
            logger.error(`${err}`)
        })
}
