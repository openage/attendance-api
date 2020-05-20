'use strict'
const userService = require('../../services/employee-getter')
const attendanceService = require('../../services/attendances')
const shiftTypeService = require('../../services/shift-types')
const shiftService = require('../../services/shifts')
exports.process = async (holiday, context) => {
    let shiftTypes = await shiftTypeService.search({}, context)

    for (const shiftType of shiftTypes) {
        let shift = await shiftService.get({
            shiftType: shiftType,
            date: holiday.date
        }, context)

        await shiftService.reset(shift, context)
    }

    let users = await userService.search({}, null, context)

    for (const user of users) {
        await attendanceService.reset({
            user: user,
            date: holiday.date
        }, {}, context)
    }
}
