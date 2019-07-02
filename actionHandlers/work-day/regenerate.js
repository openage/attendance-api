const db = require('../../models')
const dates = require('../../helpers/dates')
const moment = require('moment')

const attendanceService = require('../../services/attendances')

const resetAttendance = async (employee, date, context) => {
    let attendance = await attendanceService.getAttendanceByDate(date, employee, { create: true }, context)
    await attendanceService.reset(attendance, {
        removeWeekOff: false,
        adjustTimeLogs: true,
        recalculateShift: true
    }, context)
}

exports.process = async (data, context) => {
    let logger = context.logger.start('fixing')

    let fromDate = dates.date(data.date).bod()

    if (data.employee && data.employee.id) {
        let employee = await db.employee.findById(data.employee.id)
        await resetAttendance(employee, fromDate, context)
        return logger.end()
    }

    let employees = await db.employee.find({
        organization: global.toObjectId(context.organization.id),
        status: 'active'
    })

    logger.debug(`fetched '${employees.length}' employee(s)`)

    for (const employee of employees) {
        await resetAttendance(employee, fromDate, context)
    }
    logger.end()
}
