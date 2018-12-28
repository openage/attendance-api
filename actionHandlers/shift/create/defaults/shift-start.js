'use strict'

const attendances = require('../../../../services/attendances')
const shifts = require('../../../../services/shifts')
const offline = require('@open-age/offline-processor')

const dates = require('../../../../helpers/dates')
const contextBuilder = require('../../../../helpers/context-builder')
const db = require('../../../../models')

exports.process = async (data, context) => {
    let shiftType = data.shiftType
    let date = data.date || dates.date().bod()
    let logger = context.logger.start(`${shiftType.code}: ${date}`)

    logger.debug(`getting shift`)
    let shift = await shifts.shiftByShiftType(shiftType, date, context)

    logger.debug(`getting employees for shift: ${shiftType.code}`)
    let employees = await db.employee.find({
        shiftType: shiftType._id,
        status: 'active'
    }).populate('organization')

    employees = employees || []

    logger.debug(`${employees.length} employee(s) fetched`)

    for (const employee of employees) {
        let log = logger.start(`employee:${employee.code}`)

        var newContext = await contextBuilder.create({
            employee: employee,
            organization: employee.organization
        }, log)

        log.debug(`checking and marking missed swipe`)
        await attendances.markPreviousMissSwipe(employee, newContext)

        log.debug(`getting attendance of employee`)
        let attendance = await attendances.getAttendanceByShift(employee, shift, newContext)
        log.info(`got attendance with status ${attendance.status}`)

        await offline.queue('supervisor', 'attendance', {
            id: attendance.id,
            lastWorkedHours: 0,
            updatePreviousAttendance: false
        }, newContext)

        await offline.queue('shift', 'start', {
            employee: employee
        }, newContext)

        log.end()
    }
    logger.end()
}
