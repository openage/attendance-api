'use strict'
const logger = require('@open-age/logger')('handlers.organizations.updatingAlerts')
const db = require('../../../../models')

exports.process = (data, context, callback) => {
    let alertType = data.alert
    return db.organization.find({})
        .then(organizations => {
            logger.info('all orgnizations will update with default alert')
            return Promise.each(organizations, org => {
                return new db.alert({
                    alertType: alertType._id || alertType.id,
                    organization: org
                }).save()
            })
                .catch(err => {
                    throw err
                })
            return callback()
        })
        .catch(err => {
            logger.info('Create Default Alerts Err :')
            logger.error(err)
            callback(err)
        })
}
