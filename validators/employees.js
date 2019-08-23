'use strict'
const dates = require('../helpers/dates')

exports.canFingerRegistration = async (req) => {
    if (!req.query.operation) {
        throw new Error('operation is required')
    }

    if ('remove|fetch|add|delete'.indexOf(req.query.operation.toLowerCase()) === -1) {
        throw new Error('invalid operation type')
    }
}

exports.canUpdate = async (req) => {
    if (req.body.effectiveShift && dates.date(req.body.effectiveShift.date).isPast()) {
        throw new Error('shift date change must be larger than current date')
    }
}
