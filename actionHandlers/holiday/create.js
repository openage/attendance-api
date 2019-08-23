'use strict'
const users = require('../../services/employee-getter')
const attendances = require('../../services/attendances')
const shiftTypeService = require('../../services/shift-types')
const shiftService = require('../../services/shifts')
exports.process = async (holiday, context) => {
    let shiftTypes = await shiftTypeService.search({}, context)

    for (const shiftType of shiftTypes) {
        let shift = await shiftService.get({
            shiftType: shiftType,
            date: holiday.date
        }, context)

        shift.status = shiftService.states.holiday
        shift.holiday = holiday

        await shift.save()
    }

    let employees = await users.search({}, null, context)

    for (const employee of employees) {
        let attendance = await attendances.get({
            employee: employee,
            date: holiday.date
        }, context)

        attendance.status = attendances.attendanceStatus.holiday
        attendance.save()
    }
}
