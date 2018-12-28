'use strict'
const logger = require('@open-age/logger')('services.employee')
const async = require('async')
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const db = require('../models')
const employees = require('../services/employees')
const dates = require('../helpers/dates')
const shiftTypes = require('../services/shift-types')

var createEffectiveShift = (data) => {
    return db.effectiveShift.findOne({ employee: data.employee, date: data.date, shiftType: data.shiftType })
        .then((effectiveShiftType) => {
            if (!effectiveShiftType) {
                return new db.effectiveShift(data).save()
            }
            return effectiveShiftType
        })
        .catch((err) => {
            logger.error(err)
            return err
        })
}

exports.reset = async (context) => {
    let employeeQuery = {
        organization: context.organization.id,
        status: 'active'
    }

    let employees = await db.employee.find(employeeQuery)
        .populate('shiftType')
}

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

exports.addEffectiveShift = (employee, orgId, callback) => {
    let query = {
        organization: orgId,
        code: employee.empCode
    }
    return async.eachSeries(employee.rosterShiftTypes, (rosterShiftType, next) => {
        return db.shiftType.findOne({ organization: orgId, code: rosterShiftType.code })
            .then((shift) => {
                if (!shift) {
                    throw new Error('No ShiftType Found')
                }
                let data = {
                    shiftType: shift.id,
                    date: moment(rosterShiftType.date, 'DD/MM/YYYY', true),
                    organization: orgId
                }
                return db.employee.findOne(query)
                    .then((employee) => {
                        if (!employee) {
                            throw new Error('No Employee Found')
                        }
                        data.employee = employee.id
                        data.supervisor = employee.supervisor.toString()
                        return createEffectiveShift(data)
                            .then((shift) => {
                                console.log('shiftType Add')
                                next()
                            })
                    })
                    .catch(err => {
                        logger.error(err)
                        next()
                    })
            })
            .catch((err) => {
                logger.error(err)
                next()
            })
    }, (err) => {
        if (err) {
            return callback(err)
        }
        return callback(null)
    })
}

exports.createEffectiveShift = createEffectiveShift
