'use strict'

const moment = require('moment')

const extraWorkDetails = attendance => {
    let timeDetails = {}

    if (attendance) {
        timeDetails.shiftHours = moment(
            moment(attendance.shift.shiftType.endTime).get('hour')
        ).diff(moment(moment(attendance.shift.shiftType.startTime).get('hour')))

        if (attendance.getExtraHours.byShiftEnd) {
            if (attendance.checkOut) {
                let shiftEnd = moment()
                    .set('year', moment(attendance.checkOut).year())
                    .set('month', moment(attendance.checkOut).month())
                    .set('date', moment(attendance.checkOut).date())
                    .set('hour', moment(attendance.shift.shiftType.endTime).hour())
                    .set('minute', moment(attendance.shift.shiftType.endTime).minutes())
                    .set('second', moment(attendance.shift.shiftType.endTime).seconds())
                    .set(
                        'millisecond',
                        moment(attendance.shift.shiftType.endTime).milliseconds()
                    )
                if (moment(attendance.checkOut).isAfter(moment(shiftEnd))) {
                    timeDetails.extraHours = moment(
                        moment(attendance.checkOut).get('hour')
                    ).diff(moment(moment(attendance.shift.shiftType.endTime).get('hour')))
                    timeDetails.extraMinutes = moment(
                        moment(attendance.checkOut).get('minute')
                    ).diff(
                        moment(moment(attendance.shift.shiftType.endTime).get('minute'))
                    )
                }
            }
            return timeDetails
        } else {
            let hoursWorked = attendance.hoursWorked + (attendance.minsWorked / 60)
            if (hoursWorked > timeDetails.shiftHours) {
                timeDetails.extraHours = attendance.hoursWorked - timeDetails.shiftHours
                timeDetails.extraMinutes = attendance.minsWorked
            }
            if (timeDetails.shiftHours > hoursWorked && (!hoursWorked == 0)) {
                timeDetails.shortHours = timeDetails.shiftHours - (attendance.hoursWorked + 1)
                timeDetails.shortMinutes = 60 - attendance.minsWorked
            }
            return timeDetails
        }
    }
}

const getAttendanceByOfDate = (i, attendanceStats) => {
    return attendanceStats.find(attendance => {
        return moment(attendance.ofDate).date() === i
    })
}

exports.extraWorkDetails = extraWorkDetails
exports.getAttendanceByOfDate = getAttendanceByOfDate
