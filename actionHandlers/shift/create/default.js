'use strict'

const attendances = require('../../../services/attendances')
const db = require('../../../models')

exports.process = async (shift, context) => {
    let shiftType = shift.shiftType

    let logger = context.logger.start({
        shift: shift.id
    })

    let employees = await db.employee.find({
        shiftType: shiftType,
        status: 'active'
    })

    employees = employees || []

    context.logger.debug(`${employees.length} employee(s) fetched`)

    for (const employee of employees) {
        let log = logger.start({
            employee: employee.id
        })

        let attendance = await attendances.getAttendanceByShift(employee, shift, { create: true }, context)
        log.debug(`got attendance with status ${attendance.status}`)

        // await teamService.updateTeamSummary({
        //     attendance: attendance,
        //     lastWorkedHours: 0,
        //     updatePreviousAttendance: false
        // }, context)

        // await offline.queue('shift', 'start', {
        //     employee: employee
        // }, context)

        log.end()
    }
    logger.end()
}
