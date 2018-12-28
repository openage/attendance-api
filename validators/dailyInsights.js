'use strict'
const logger = require('@open-age/logger')('validators/dailyInsight')

exports.canGetByAlert = (req, callback) => {
    logger.start('getByAlert')

    if (!req.query.alertId) {
        return callback('alertId is required')
    }

    return callback()
}
