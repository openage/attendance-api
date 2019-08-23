'use strict'

const moment = require('moment')
const db = require('../models')

exports.canCreate = async (req) => {
    if (!req.body.date) {
        throw new Error('date is required')
    }

    if (!req.body.shiftType) {
        throw new Error('shiftType is required')
    }

    if (!req.body.employee) {
        throw new Error('employee is required')
    }

    if (moment(req.body.date).isBefore(moment().endOf('day'))) {
        throw new Error('invalid date to update effectiveShift')
    }

    // TODO: Remove Employee Work
    let employee = await db.employee.findById(req.body.employee)
    req.body.date = moment(req.body.date).startOf('day').toDate()
    req.body.supervisor = employee.supervisor
    req.body.organization = req.context.organization
}
