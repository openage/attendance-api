'use strict'
const moment = require('moment')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.submit.handlers.send-notification-to-supervisor')
const async = require('async')
const db = require('../../../models')
exports.process = (data, alert, context) => {
    logger.info(`daily-summary-to-supervisor has been triggered`)

    let supervisorLevel = 0
    let channels = []
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    // if (alert.config.trigger) {

    // }

    db.team.find({
        supervisor: employeeId,
        employee: { $exists: true }
    }).populate('supervisor employee').then(teams => {
        let attendances = []
        if (!teams || (teams && !teams.length)) { return null }

        async.eachSeries(teams, (team, next) => {
            if (!team.employee) { return next() }
            db.attendance.findOne({
                employee: team.employee.id,
                ofDate: {
                    $exists: true,
                    $gte: moment().startOf('day').subtract(1, 'day').toDate(),
                    $lt: moment().endOf('day').subtract(1, 'day').toDate()
                }
            }).populate('employee').then(attendance => {
                if (attendance) { attendances.push(attendance) }
                next()
            }).catch()
        }, (err) => {
            let totalEmps = attendances.length
            if (totalEmps == 0) return null

            return communications.send({
                employee: teams[0].supervisor,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(teams[0].supervisor, 'employee'),
                data: {
                    totalEmployees: totalEmps,
                    attendances: attendances,
                    employee: teams[0].supervisor,
                    totalEmployees: totalEmps
                },
                template: 'daily-summary-to-supervisor'
            }, channels, context)
        })
    })
}
