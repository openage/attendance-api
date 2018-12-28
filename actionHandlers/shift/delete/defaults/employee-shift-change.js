'use strict'

const logger = require('@open-age/logger')('handlers.shift.delete.employee-shift-change')
const effectiveShifts = require('../../../../services/effectiveShifts')
const db = require('../../../../models')
const moment = require('moment')

exports.process = (data, context, cb) => {
    logger.start('process')
    let shiftType = data.shiftType

    Promise.all([
        db.shiftType.findOne({ organization: context.organization.id, code: 'gen' }),
        db.employee.find({ shiftType: shiftType.id })

    ])
        .spread((newShift, employees) => {
            let effectiveShiftModel = {
                shiftType: newShift.id,
                date: moment().add(1, 'day').startOf('day').toDate(),
                organization: context.organization.id
            }

            Promise.each(employees, (employee) => {
                effectiveShiftModel.employee = employee.id
                effectiveShiftModel.supervisor = employee.supervisor.toString()
                effectiveShifts.createEffectiveShift(effectiveShiftModel)
            })
                .then(() => {
                    return cb()
                })
        })
}
