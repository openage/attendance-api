'use strict'
const async = require('async')
const entities = require('../../../../helpers/entities')
const communications = require('../../../../services/communications')
const logger = require('@open-age/logger')
('employee.new.defaults.configure-holidays')

exports.process = (data, context, callback) => {
    let supervisorLevel = 0
    let channels = ['push', 'email']

    return communications.send({
        employee: data.employee,
        level: supervisorLevel
    }, {
        entity: entities.toEntity(data.employee, 'employee'),
        data: {
            name: data.employee.name
        },
        template: data.employee.userType === 'admin' ? 'welcome-admin' : 'welcome-employee'
    }, channels, context)
        .then(() => {
            callback(null)
        })
        .catch(err => {
            callback(err)
        })
}
