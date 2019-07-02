'use strict'
const shiftTypeService = require('../../../../services/shift-types')
const attendanceService = require('../../../../services/attendances')

const db = require('../../../../models')

exports.process = async (data, context) => {
    let employee = await db.employee.findById(data.id)

    context.logger.info(`configuring holidays of ${employee.name || employee.code}`)

    let holidays = await db.holiday.find({ organization: context.organization }) // TODO: get future date

    if (!employee.shiftType) {
        let shiftType = await shiftTypeService.get('gen', context)
        if (!shiftType) {
            shiftType = await shiftTypeService.create({ code: 'gen', name: 'General' }, context)
        }
        employee.shiftType = shiftType
        await employee.save()
    }

    for (const holiday of holidays) {
        await attendanceService.getAttendanceByDate(holiday.date, employee, {}, context)
    }
}
