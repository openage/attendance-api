'use strict'
const _ = require('underscore')
const moment = require('moment')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const db = require('../../../models')
/**
     * filter all the employeeswhoes location is off
     * @param Employee supervisor
     * @param Minutes minutes
     */
let getLocationOffEmployees = (supervisor, minutes) => {
    return new Promise((resolve, reject) => {
        // count of employees who's loction not found
        let employees = []
        return db.team.find({
            supervisor: supervisor,
            employee: { $exists: true }
        }).populate('employee')
            .then(teams => {
                if (!teams || !teams.length) return null

                let members = _.filter(_.pluck(teams, 'employee'), (i) => { return i.abilities.trackLocation })

                if (!members || !members.length) return null

                return Promise.each(members, employee => {
                    return db.attendance.findOne({
                        employee: employee,
                        ofDate: {
                            $gte: moment().startOf('day').toDate(),
                            $lt: moment().endOf('day').toDate()
                        },
                        checkIn: {
                            $exists: true,
                            $gte: moment().startOf('day').toDate()
                        }
                    }).then(attendance => {
                        return db.locationLog.findOne({
                            attendance: attendance,
                            employee: attendance.employee,
                            message: { $exists: true },
                            time: {
                                $gte: moment().subtract(minutes, 'minute').toDate()
                            }
                        })
                    }).then(locationLog => {
                        if (locationLog) { return employees.push(employee) }
                    })
                })
                    .then(() => resolve(employees))
                    .catch((err) => reject(err))
            })
    })
}

exports.process = (data, alert, context) => {
    let supervisorLevel = 0
    let channels = ['push']
    let minutes = 60

    if (alert.config.trigger) {
        minutes = alert.config.trigger.minutes || minutes
    };

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    };

    return db.employee.find({ shiftType: data.id }).populate('shiftType').then(supervisors => {
        return Promise.each(supervisors, supervisor => {
            return getLocationOffEmployees(supervisor, minutes).then(employees => {
                if (!employees.length) { return null }
                return communications.send({
                    employee: supervisor,
                    level: supervisorLevel
                }, {
                    actions: [],
                    entity: entities.toEntity(supervisor, 'employee'),
                    data: {
                        employees: employees,
                        minutes: minutes,
                        count: employees.length
                    },
                    template: 'location-off'
                }, channels, context)
            })
        })
    }).catch(err => {
        return Promise.cast(null)
    })
}
