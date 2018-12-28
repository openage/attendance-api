'use strict'
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.approve.notify-employee')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    let supervisorLevel = 1
    let channels = ['push']
    let leaveId = data.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    return db.leave.findById(leaveId)
        .populate('employee leaveType')
        .then(leave => {
            return db.leaveBalance.findOne({ employee: leave.employee.id, leaveType: leave.leaveType.id }).populate('employee leaveType')
        }).then(leaveBalance => {
            let days = leaveBalance.leaveType.unitsPerDay ? ((Math.trunc((leaveBalance.units / leaveBalance.leaveType.unitsPerDay) * 10)) / 10) : 0

            if (leaveBalance.leaveType.unlimited || days > 0) { return null }

            return communications.send({
                employee: leaveBalance.employee,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(leaveBalance.employee, 'employee'),
                data: {
                    leaveType: leaveBalance.leaveType.name,
                    employee: leaveBalance.employee
                },
                template: 'exhausted-all-leaves'
            }, channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert exhausted-all-leaves`)
            logger.error(`${err}`)
        })
}
