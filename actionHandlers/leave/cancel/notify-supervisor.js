'use strict'
const communications = require('../../../services/communications')
const entities = require('../../../helpers/entities')
const leaveKinds = require('../../../helpers/leaveKinds')
const logger = require('@open-age/logger')(
    'attendance.check-in.handlers.notify-supervisor-for-minutes-late-inRow'
)

const db = require('../../../models')
exports.process = (data, alert, context) => {
    let supervisorLevel = 1
    let channels = ['push']
    let leaveId = data.id

    return db.leave.findById(leaveId)
        .populate({
            path: 'employee',
            populate: {
                path: 'supervisor'
            }
        })
        .then(leave => {
            if (leave.employee.supervisor.id.toString() === context.employee.id.toString()) {
                logger.info('cancelled by supervisor, ignoring notify to supervisor')
                return
            }
            leave.leaveKind = leaveKinds.getLeaveKind(leave)
            return communications.send({
                employee: leave.employee,
                level: supervisorLevel
            }, {
                actions: [
                    'leaveDetail'
                ],
                entity: entities.toEntity(leave.employee, 'employee'),
                data: {
                    leave: leave
                },
                template: 'leave-cancellation'
            },
            channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert leave-submission`)
            logger.error(`${err}`)
        })
}
