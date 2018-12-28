'use strict'
const logger = require('@open-age/logger')('system')
const _ = require('underscore')
const mapper = require('../mappers/system')
const db = require('../models')

var employeeIds = []

var activeEmployeeCount = organization => {
    return db.employee.find({
        organization: organization._id.toString(),
        status: 'active'
    }).count()
}

var neverLoggedInCount = organization => {
    return db.employee.find({
        organization: organization._id.toString(),
        recentLogin: { $exists: false }
    }).count()
}

var lastAdminLogin = organization => {
    return db.employee.findOne({
        organization: organization._id.toString(),
        userType: 'superadmin',
        status: 'active'
    })
        .select('recentLogin')
}

var timeLogsCount = organization => {
    return db.timeLog.find({
        employee: {
            $in: employeeIds
        }
    }).count()
}

var alertsCount = organization => {
    return db.alert.find({
        organization: organization._id.toString(),
        status: 'active'
    }).count()
}

var wifiCount = organization => {
    return db.device.find({
        organization: organization._id.toString(),
        bssid: { $exists: true, $ne: '' }
    }).count()
}

var biometricCount = organization => {
    return db.device.find({
        organization: organization._id.toString(),
        $or: [{ bssid: '' }, { bssid: { $exists: false } }]
    }).count()
}

var lastEmployeeLogin = organization => {
    return db.employee.findOne({
        organization: organization._id.toString()
    }).sort({ 'recentLogin': -1 }).select('recentLogin')
}

var lastTimeLog = organization => {
    return db.timeLog.findOne({
        employee: {
            $in: employeeIds
        }
    }).sort({ time: -1 }).select('time')
}

exports.usage = (req, res) => {
    return db.organization.find({}).lean()
        .then((organizations) => {
            return Promise.each(organizations, organization => {
                return db.employee.find({
                    organization: organization._id
                }).select('_id').lean()
                    .then(employees => {
                        employeeIds = _.pluck(employees, '_id')
                        return Promise.all([
                            activeEmployeeCount(organization),
                            neverLoggedInCount(organization),
                            lastAdminLogin(organization),
                            timeLogsCount(organization),
                            alertsCount(organization),
                            wifiCount(organization),
                            biometricCount(organization),
                            lastEmployeeLogin(organization),
                            lastTimeLog(organization)
                        ])
                            .spread((activeEmployeeCount, neverLoggedInCount, lastAdminLogin, timeLogsCount, alertsCount, wifiCount, biometricCount, lastEmployeeLogin, lastTimeLog) => {
                                organization.activeEmployeeCount = activeEmployeeCount
                                organization.neverLoggedInCount = neverLoggedInCount
                                organization.lastAdminLogin = lastAdminLogin
                                organization.timeLogsCount = timeLogsCount
                                organization.alertsCount = alertsCount
                                organization.wifiCount = wifiCount
                                organization.biometricCount = biometricCount
                                organization.lastEmployeeLogin = lastEmployeeLogin
                                organization.lastTimeLog = lastTimeLog
                            })
                    })
            }).then((organizations) => {
                organizations.sort(function (a, b) { return b.activeEmployeeCount - a.activeEmployeeCount })
                res.page(mapper.toSearchModel(organizations))
            })
        })
}
