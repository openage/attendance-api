'use strict'

const dates = require('../../../../helpers/dates')
const db = require('../../../../models')

exports.process = async (data, context) => {
    let from = dates.date(data.date || new Date()).bod()
    let till = dates.date(data.till || from).eod()
    let effectiveShifts = await db.effectiveShift.find({
        date: {
            $gte: from,
            $lt: till
        }
    }).sort({ 'date': -1 })

    effectiveShifts = effectiveShifts || []
    context.logger.info(`${effectiveShifts.length} change(s) found form '${from}' to ${till}`)

    for (const effectiveShift of effectiveShifts) {
        let employee = await db.employee.findById(effectiveShift.employee)
        employee.shiftType = effectiveShift.shiftType
        await employee.save()
        context.logger.info(`changed shift of ${employee.code} to ${employee.shiftType.toString()}`)
    }
}
