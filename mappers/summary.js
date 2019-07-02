'use strict'
let _ = require('underscore')
var moment = require('moment')
var async = require('async')
var timeLogMapper = require('./timeLog')

exports.toModel = (months, weeks, currentWeek, today) => {
    var model = {}
    model.today = {}
    model.currentWeek = {}
    model.currentMonth = {}
    model.currentYear = {}

    if (today) {
        model.today = {
            id: today.id,
            status: today.status,
            checkIn: today.checkIn,
            checkOut: today.checkOut,
            hoursWorked: today.hoursWorked || 0,
            minsWorked: today.minsWorked || 0,
            recentMostTimeLog: {}
        }

        if (today.recentMostTimeLog) {
            if (today.recentMostTimeLog._doc) {
                model.today.recentMostTimeLog = {
                    id: today.recentMostTimeLog.id,
                    type: today.recentMostTimeLog.type,
                    device: today.recentMostTimeLog.device,
                    employee: today.recentMostTimeLog.employee,
                    time: today.recentMostTimeLog.time,
                    source: today.recentMostTimeLog.source
                }
            } else {
                model.attendance.recentMostTimeLog = {
                    id: today.recentMostTimeLog.toString()
                }
            }
        }
    }

    if (currentWeek) {
        model.currentWeek.days = []
        var count = 0

        currentWeek.attendances.forEach(attendance => {
            let hoursWorked = 0
            if (attendance.hoursWorked || attendance.minsWorked) {
                count++
                hoursWorked = attendance.hoursWorked + (attendance.minsWorked / 60)
            }

            model.currentWeek.days.push({
                ofDate: attendance.ofDate,
                hoursWorked: hoursWorked === 0 ? 0 : hoursWorked
            })
        })
        model.currentWeek.avgHours = count === 0 ? 0 : currentWeek.hoursWorked / count
    }

    if (!_.isEmpty(weeks)) {
        let totalWeekHours = 0
        let totalPresentDays = 0
        model.currentMonth.weeks = []
        let allWeeks = []
        let attendanceLength = 0
        let count = 0
        weeks.forEach(week => {
            let newWeek = []
            attendanceLength = week.attendances.length

            let singleWeek = moment(week.weekStart).add(7, 'days')
            week.attendances.forEach(attendance => {
                if (attendance.hoursWorked || attendance.minsWorked) {
                    totalPresentDays++
                }
                if (moment(attendance.ofDate) < singleWeek) {
                    newWeek.push(attendance)
                }
                if (moment(attendance.ofDate) >= singleWeek || (count === attendanceLength - 1)) {
                    allWeeks.push(newWeek)
                    newWeek = []
                    newWeek.push(attendance)
                    singleWeek = singleWeek.add(7, 'days')
                }
                count++
            })
            allWeeks.forEach(aWeek => {
                let daysCount = aWeek.length
                let hoursWorked = 0
                aWeek.forEach(days => {
                    if (!days.hoursWorked) {
                        daysCount--
                    } else {
                        hoursWorked = hoursWorked + (days.hoursWorked + (days.minsWorked / 60))
                    }
                })
                model.currentMonth.weeks.push({
                    startDate: moment(),
                    endDate: moment(),
                    avgHours: hoursWorked === 0 ? 0 : hoursWorked / daysCount
                })
            })
            totalWeekHours = totalWeekHours + week.hoursWorked
        })
        model.currentMonth.avgHours = totalWeekHours === 0 ? 0 : totalWeekHours / totalPresentDays
    }

    if (!_.isEmpty(months)) {
        let totalMonthHours = 0
        let totalWorkingDays = 0
        model.currentYear.months = []
        months.forEach(month => {
            totalMonthHours = month.hoursWorked + totalMonthHours
            totalWorkingDays = totalWorkingDays + month.attendanceCount

            model.currentYear.months.push({
                startDate: moment(month.endMonth).startOf('month'),
                endDate: month.endMonth,
                avgHours: month.attendanceCount === 0 ? 0 : month.hoursWorked / month.attendanceCount
            })
        })

        model.currentYear.avgHours = totalWorkingDays === 0 ? 0 : totalMonthHours / totalWorkingDays
    }
    return model
}

exports.toSearchModel = (entities) => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}

exports.toTeamSummary = entities => {
    return entities.map(entity => {
        // return exports.toModel(entity.tillCurrentYear, entity.tillCurrentMonth, entity.tillCurrentWeek, entity.today);
        var model = {
            id: entity.employee.id,
            name: entity.employee.name,
            code: entity.employee.code,
            designation: entity.employee.designation,
            picData: entity.employee.picData,
            picUrl: entity.employee.picUrl,
            email: entity.employee.email,
            phone: entity.employee.phone
        }

        var data = exports.toModel(entity.tillCurrentYear, entity.tillCurrentMonth, entity.tillCurrentWeek, entity.today)
        model.attendance = data
        return model
    })
}

exports.monthlySummary = entity => {
    var model = {
        id: entity._id.toString(),
        name: entity.employeeModel.name,
        code: entity.employeeModel.code,
        biometricCode: entity.employeeModel.biometricCode,
        designation: entity.employeeModel.designation,
        department: entity.employeeModel.department,
        picData: entity.employeeModel.picData,
        picUrl: entity.employeeModel.picUrl === '' ? null : entity.employeeModel.picUrl,
        absentDays: entity.attendanceSummary.absent,
        presentDays: entity.attendanceSummary.present,
        leaveDays: entity.attendanceSummary.leaves,
        offDays: entity.attendanceSummary.weekOff,
        holidayDays: entity.attendanceSummary.holiday
    }
    model.employee = {
        id: entity.employeeModel.id,
        name: entity.employeeModel.name,
        code: entity.employeeModel.code,
        picData: entity.employeeModel.picData,
        picUrl: entity.employeeModel.picUrl === '' ? null : entity.employeeModel.picUrl,
        biometricCode: entity.employeeModel.biometricCode,
        designation: entity.employeeModel.designation,
        department: entity.employeeModel.department
    }
    // if (entity.leaveBalances) {
    //     model.totalLeaveBalance = 0
    //     entity.leaveBalances.forEach(leaveBalance => {
    //         model.totalLeaveBalance = model.totalLeaveBalance + Math.trunc((leaveBalance.units / leaveBalance.leaveType.unitsPerDay) * 10) / 10
    //     })
    // }
    // if (entity.shiftType) {
    //     model.shiftType = {
    //         id: entity.shiftType._id.toString(),
    //         name: entity.shiftType.name,
    //         code: entity.shiftType.code,
    //         startTime: entity.shiftType.startTime,
    //         endTime: entity.shiftType.endTime
    //     }
    // }
    return model
}

exports.logs = entities => {
    return entities.map(entity => {
        var model = {

            id: entity.id,
            status: entity.status,
            // lastUpdated: entity.ofDate,
            checkIn: entity.checkIn,
            checkOut: entity.checkOut,
            ofDate: entity.ofDate,
            hoursWorked: entity.hoursWorked,
            minsWorked: entity.minsWorked,
            checkOutExtend: entity.checkOutExtend
        }

        if (entity.shift) {
            if (entity.shift._doc) {
                model.shift = {
                    id: entity.shift.id,
                    date: entity.shift.date,
                    status: entity.shift.status
                }

                if (entity.shift.holiday) {
                    model.shift.holiday = {}
                    if (entity.shift.holiday._doc) {
                        model.shift.holiday = {
                            name: entity.shift.holiday.name,
                            date: entity.shift.holiday.date
                        }
                    } else {
                        model.shift.holiday.id = entity.shift.holiday.toString()
                    }
                }
                if (entity.shift.shiftType) {
                    model.shift.shiftType = {}
                    if (entity.shift.shiftType._doc) {
                        model.shift.shiftType = {
                            name: entity.shift.shiftType.name,
                            startTime: entity.shift.shiftType.startTime,
                            endTime: entity.shift.shiftType.endTime
                        }
                    } else {
                        model.shift.shiftType.id = entity.shift.shiftType.toString()
                    }
                }
            } else {
                model.shift = {
                    id: entity.shift.toString()
                }
            }
        }
        model.timeLogs = []
        if (entity.timeLogs && entity.timeLogs.length) {
            entity.timeLogs.forEach(item => {
                model.timeLogs.push(timeLogMapper.toModel(item))
            })
        }
        return model
    })
}

exports.toPdfModel = entity => {
    var model = {
        code: entity.code,
        name: entity.name,
        present: entity.presentDays,
        leave: entity.leaveDays,
        holiday: entity.holiday,
        weekOff: entity.weekOff,
        absent: entity.absentDays,
        onDuty: entity.onDuty,
        hoursWorked: entity.hoursWorked.toFixed(2)
    }

    var attendances = []
    if (entity.attendances) {
        var oneDayAttendance = {}
        _.each(entity.attendances, attendance => {
            oneDayAttendance = {
                checkIn: attendance.checkIn ? moment(attendance.checkIn).format('H:mm') : '',
                checkOut: attendance.checkOut ? moment(attendance.checkOut).format('H:mm') : '',
                date: moment(attendance.ofDate).format('D'),
                hoursWorked: attendance.hoursWorked ? attendance.hoursWorked : '',
                minsWorked: attendance.minsWorked ? attendance.minsWorked : ''
            }

            if (attendance.shift) {
                var totalShiftTime = Math.abs(moment(attendance.shift.shiftType.endTime).diff(moment(attendance.shift.shiftType.startTime), 'minutes'))
                var shiftMins = totalShiftTime % 60
                var shiftHours = (totalShiftTime - shiftMins) / 60
                var totalShiftHours = shiftHours + (shiftMins / 60)
                oneDayAttendance.shiftHours = totalShiftHours.toFixed(0)
            }

            if (attendance.status === 'NA') {
                oneDayAttendance.status = ''
                oneDayAttendance.shiftType = ''
            } else {
                if (attendance.shift.status === 'working') {
                    oneDayAttendance.shiftType = attendance.shift.shiftType.code.toUpperCase()
                    oneDayAttendance.status = attendance.status.charAt(0).toUpperCase()
                } else if (!attendance.shift || !attendance.shift.status) {
                    oneDayAttendance.status = ''
                    oneDayAttendance.shiftType = ''
                } else {
                    oneDayAttendance.status = attendance.shift.status.charAt(0).toUpperCase()
                    oneDayAttendance.shiftType = attendance.shift.shiftType.code.toUpperCase()
                }
            }
            if (attendance.hoursWorked || attendance.minsWorked) {
                if (attendance.hoursWorked < totalShiftHours) {
                    oneDayAttendance.shortMins = ((totalShiftHours - (attendance.hoursWorked + (attendance.minsWorked / 60))) * 60).toFixed(0)
                    oneDayAttendance.extraWorkedMins = ''
                } else if (attendance.hoursWorked >= totalShiftHours) {
                    oneDayAttendance.extraWorkedMins = (((attendance.hoursWorked + (attendance.minsWorked / 60)) - totalShiftHours) * 60).toFixed(0)
                    oneDayAttendance.shortMins = ''
                }
            } else {
                oneDayAttendance.extraWorkedMins = ''
                oneDayAttendance.shortMins = ''
            }

            if (attendance.checkOut) {
                let shiftEnd = moment()
                    .set('year', moment(attendance.checkOut).year())
                    .set('month', moment(attendance.checkOut).month())
                    .set('date', moment(attendance.checkOut).date())
                    .set('hour', moment(attendance.shift.shiftType.endTime).hour())
                    .set('minute', moment(attendance.shift.shiftType.endTime).minutes())
                    .set('second', moment(attendance.shift.shiftType.endTime).seconds())
                    .set('millisecond', moment(attendance.shift.shiftType.endTime).milliseconds())
                if (moment(attendance.checkOut).isAfter(moment(shiftEnd))) {
                    let extraHours = moment(moment(attendance.checkOut).get('hour')).diff(moment(moment(attendance.shift.shiftType.endTime).get('hour')))
                    let extraMinutes = moment(moment(attendance.checkOut).get('minute')).diff(moment(moment(attendance.shift.shiftType.endTime).get('minute')))
                    oneDayAttendance.ExtraHoursByShiftEnd = (extraHours * 60) + extraMinutes
                }
            } else {
                oneDayAttendance.ExtraHoursByShiftEnd = ''
            }
            attendances.push(oneDayAttendance)
        })
    }
    model.attendances = attendances
    return model
}
