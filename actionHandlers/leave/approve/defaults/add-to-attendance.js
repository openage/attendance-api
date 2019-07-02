'use strict'
const db = require('../../../../models')
const dates = require('../../../../helpers/dates')
const attendances = require('../../../../services/attendances')

exports.process = async (data, context) => {
    let leaveId = data.id

    let leave = await db.leave.findById(leaveId).populate('employee')

    let from = leave.date
    let till = leave.toDate || leave.date

    for (let date = from; dates.date(date).isBetween(from, till); date = dates.date(date).nextBod()) {
        let attendance = await attendances.getAttendanceByDate(date, leave.employee, { create: true }, context)
        await attendances.setStatus(attendance, { removeWeekOff: true }, context)
        await attendance.save()
    }
}
