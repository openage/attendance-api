'use strict'

const logger = require('@open-age/logger')('validators/effectiveShifts')
const moment = require('moment')
const db = require('../models')

exports.canCreate = (req, callback) => {
    logger.start('canCreate')

    if (!req.body.date) {
        return callback('date is required')
    }

    if (!req.body.shiftType) {
        return callback('shiftType is required')
    }

    if (!req.body.employee) {
        return callback('employee is required')
    }

    if (moment(req.body.date).isBefore(moment().endOf('day'))) {
        return callback('invalid date to update effectiveShift')
    }

    // TODO: Remove Employee Work
    db.employee.findById(req.body.employee)
        .then((employee) => {
            req.body.date = moment(req.body.date).startOf('day').toDate()
            req.body.supervisor = employee.supervisor
            req.body.organization = req.context.organization
            return callback()
        })
        .catch((err) => {
            return callback(err)
        })
}
