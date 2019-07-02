'use strict'

const effectiveShifts = require('../../services/effectiveShifts')
const db = require('../../models')
const moment = require('moment')

exports.process = async (shiftType, context) => {
    let genShift = await db.shiftType.findOne({ organization: context.organization, code: 'gen' })
    let date = moment().add(1, 'day').startOf('day').toDate()
    let employees = db.employee.find({ shiftType: shiftType.id })

    for (const employee of employees) {
        employee.shiftType = genShift
        await employee.save
        await effectiveShifts.create({
            employee: employee,
            shiftType: genShift,
            date: date
        }, context)
    }
}
