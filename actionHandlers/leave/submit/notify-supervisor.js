'use strict'
const _ = require('underscore')
const moment = require('moment')
const join = require('path').join
const communications = require('../../../services/communications')
const entities = require('../../../helpers/entities')
const leaveKinds = require('../../../helpers/leaveKinds')
const logger = require('@open-age/logger')
('attendance.check-in.handlers.notify-supervisor-for-minutes-late-inRow')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    let supervisorLevel = 1
    let channels = ['push']
    let leaveId = data.id
    let maxLeaves = 2

    if (alert.config.trigger) {
        maxLeaves = alert.config.trigger.noOfMaxLeavesInMonth ? alert.config.trigger.noOfMaxLeavesInMonth : maxLeaves
    }

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    return db.leave.findById(leaveId).populate('employee')
        .then(leave => {
            leave.leaveKind = leaveKinds.getLeaveKind(leave)

            let date = moment(leave.date.toISOString()).startOf('month').toDate()

            db.leave.find({
                employee: leave.employee.id,
                status: /submitted|approved/,
                date: {
                    $exists: true,
                    $gte: date
                }
            }).populate('employee leaveType')
                .then(leaves => {
                    let totalDays = 0
                    _.each(leaves, (leave) => {
                        totalDays = totalDays + leave.days
                    })
                    let maxLeavesContent = ''
                    if (totalDays > maxLeaves) { maxLeavesContent = `Approving this will exceeds the permissible limit of ${maxLeaves} days.` }

                    return communications.send({
                        employee: leave.employee,
                        level: supervisorLevel
                    }, {
                        actions: [
                            'approve', 'reject'
                        ],
                        entity: entities.toEntity(leave.employee, 'employee'),
                        data: {
                            leave: leave,
                            sender: leave.employee,
                            maxLeavesContent: maxLeavesContent
                        },
                        template: 'leave-submission'
                    }, channels, context)
                }).catch(err => {
                    logger.info(`err on trigger alert leave-submission`)
                    logger.error(`${err}`)
                })
        })
        .catch(err => {
            logger.info(`err on trigger alert leave-submission`)
            logger.error(`${err}`)
        })
}
