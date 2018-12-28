'use strict'
const logger = require('@open-age/logger')('validators/employee')

const canFingerRegistration = (req, callback) => {
    const log = logger.start('canFingerRegistration')

    if (!req.query.operation) {
        return callback('operation is required')
    }

    if (req.query.operation.toLowerCase() !== 'remove' && req.query.operation.toLowerCase() !== 'fetch' && req.query.operation.toLowerCase() !== 'add' && req.query.operation.toLowerCase() !== 'delete') {
        return callback('invalid operation type')
    }

    return callback()
}

exports.canFingerRegistration = canFingerRegistration
