'use strict'
const db = require('../models')
const employees = require('../services/employees')
const dates = require('../helpers/dates')
const shiftTypes = require('../services/shift-types')

var createEffectiveShift = async (data) => {
    let effectiveShiftType = await db.effectiveShift.findOne({
        employee: data.employee,
        date: data.date,
        shiftType: data.shiftType
    })
    if (!effectiveShiftType) {
        return new db.effectiveShift(data).save()
    }
    return effectiveShiftType
}

exports.reset = async (context) => {
    let employeeQuery = {
        organization: context.organization.id,
        status: 'active'
    }

    let employees = await db.employee.find(employeeQuery)
        .populate('shiftType')
}

/**
 * {
 *   employee: {id: String},
 *   shiftType: {id: String},
 *   date: Date,
 * }
*/
exports.create = async (model, context) => {
    let employee = await employees.get(model.employee, context)
    if (!employee) {
        throw new Error('invalid employee')
    }
    let date = dates.date(model.date).bod()
    let shiftType = await shiftTypes.get(model.shiftType, context)
    if (!shiftType) {
        throw new Error('invalid shift type')
    }
    let supervisor = model.supervisor ? await employees.get(model.supervisor, context) : null

    let effectiveShift = await db.effectiveShift.findOne({
        employee: employee,
        date: {
            $gte: date,
            $lt: dates.date(date).eod()
        }
    })
    if (!effectiveShift) {
        effectiveShift = new db.effectiveShift({
            employee: employee,
            date: date,
            organization: context.organization
        })
    }

    effectiveShift.shiftType = shiftType
    effectiveShift.supervisor = supervisor
    effectiveShift.status = 'active'

    await effectiveShift.save()

    return effectiveShift
}
