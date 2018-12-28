'use strict'
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const shifts = require('./shifts')
const shiftTypes = require('./shift-types')

const monthlySummaries = require('./monthly-summaries')
const weeklySummaries = require('./weekly-summaries')
const db = require('../models')

const employees = require('./employees')
const leaveService = require('./leaves')
const dates = require('../helpers/dates')

const timeLogService = require('./time-logs')

var timeLogType = {
    checkIn: 'checkIn',
    checkOut: 'checkOut'
}

exports.timeLogType = timeLogType

var attendanceStates = {
    checkedIn: 'checkedIn',
    absent: 'absent',
    present: 'present',
    onLeave: 'onLeave',
    missSwipe: 'missSwipe',
    halfday: 'halfday',
    weekOff: 'weekOff',
    holiday: 'holiday',
    checkedInAgain: 'checked-in-again'
}

exports.attendanceStatus = attendanceStates

const getStatusByConfig = (employee, shift, context) => {
    if (employee.weeklyOff &&
        employee.weeklyOff.isConfigured &&
        employee.weeklyOff[dates.date(shift.date).day()]) {
        return attendanceStates.weekOff
    }
    switch (shift.status) {
    case 'holiday':
        return attendanceStates.holiday
    case 'weekOff':
        return attendanceStates.weekOff
    }

    return null
}

const getAttendanceByShift = async (employee, shift, context) => {
    let attendance = await db.attendance.findOne({
        employee: employee,
        ofDate: dates.date(shift.date).bod()
    }).populate('employee recentMostTimeLog timeLogs').populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    if (attendance) {
        if (attendance.shift.id !== shift.id) {
            attendance.shift = shift
            await attendance.save()
        }
        return attendance
    }

    attendance = new db.attendance({
        employee: employee,
        status: attendanceStates.absent,
        shift: shift,
        ofDate: dates.date(shift.date).bod()
    })

    attendance.status = getStatusByConfig(employee, shift, context) || attendanceStates.absent

    await attendance.save()
    await weeklySummaries.addAttendance(attendance, context)
    await monthlySummaries.addAttendance(attendance, context)

    context.logger.debug(`created new attendance with status ${attendance.status}`)

    return attendance
}

exports.getAttendanceByShift = getAttendanceByShift

const getAttendanceByDate = async (date, employee, context) => {
    employee = await employees.get(employee, context)

    let attendance = await db.attendance.findOne({
        ofDate: dates.date(date).bod(),
        employee: employee
    }).populate('employee timeLogs').populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    if (attendance) {
        return attendance
    }

    let shiftType = await shiftTypes.getByDate(date, employee.id, context)

    let shift = await shifts.shiftByShiftType(shiftType, date, context)

    return getAttendanceByShift(employee, shift, context)
}

exports.getAttendanceByDate = getAttendanceByDate

const get = async (query, context) => {
    let log = context.logger.start('services/attendances:get')

    if (typeof query === 'string' && query.isObjectId()) {
        return db.attendance.findById(query)
            .populate('employee timeLogs')
            .populate({
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            })
    }
    if (query.id) {
        return db.attendance.findById(query.id).populate('employee timeLogs')
            .populate({
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            })
    }

    if (query.date && query.employee) {
        return getAttendanceByDate(query.date, query.employee, context)
    }

    if (query.shift && query.employee) {
        return getAttendanceByShift(query.employee, query.shift, context)
    }

    return null
}

exports.get = get

exports.markOffDay = async (model, context) => {
    let attendance = await get(model, context)
    attendance.status = attendanceStates.weekOff
    await attendance.save()
    return attendance
}

exports.markPreviousMissSwipe = async (employee, context) => {
    return db.attendance.update({
        employee: employee,
        ofDate: {
            $lt: dates.date(new Date()).bod()
        },
        status: attendanceStates.checkedIn
    }, {
        $set: {
            status: attendanceStates.missSwipe
        }
    }, {
        multi: true
    })
}

const getOngoingAttendance = async (time, status, employee, context) => {
    let log = context.logger.start('getOngoingAttendance')

    let where = {
        employee: employee,
        ofDate: {
            $gte: dates.date(time).previousBod(),
            $lt: time
        }
    }

    let ongoingAttendance = await db.attendance.find(where).sort({ ofDate: -1 })
        .populate('employee recentMostTimeLog timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })
    if (!ongoingAttendance.length) {
        return
    }

    let previousAttendance
    let previousMatch
    if (ongoingAttendance.length === 2) {
        previousAttendance = ongoingAttendance[1]
        previousMatch = ofAttendance(time, status, previousAttendance)
        log.debug('previousMatch', previousMatch)
    }

    let latestAttendance = ongoingAttendance[0]
    let latestMatch = ofAttendance(time, status, latestAttendance)
    log.debug('latestMatch', latestMatch)

    if (previousMatch && previousMatch.value > latestMatch.value) {
        return previousAttendance
    }

    if (!previousMatch && latestMatch.value === 0) {
        return null
    }

    return latestAttendance
}

const ofAttendance = (time, status, attendance) => {
    let shiftType = attendance.shift.shiftType
    var startTime = dates.date(attendance.ofDate).setTime(shiftType.startTime)

    var endTime = dates.date(attendance.ofDate).setTime(shiftType.endTime)

    if (startTime.getTime() > endTime.getTime()) {
        endTime = moment(endTime).add(1, 'day').toDate()
    }

    var nextStartTime = dates.date(startTime).add(1)

    var checkoutLimitA = moment(nextStartTime).subtract(3, 'hour')

    // user can checkout 30 minutes before the next shift starts
    var checkoutLimit = moment(nextStartTime).add(30, 'minute')

    var checkInLimit = moment(startTime).subtract(3, 'hour')

    let result = {
        checkInLimit: checkInLimit,
        startTime: startTime,
        endTime: endTime,
        checkoutLimitA: checkoutLimitA,
        checkoutLimit: checkoutLimit,
        value: 0,
        reason: 'not set'
    }

    if (moment(time).isBetween(startTime, endTime)) {
        result.value = 100
        result.reason = 'isBetween'
    } else if (moment(time).isBetween(endTime, checkoutLimitA)) {
        result.value = 70
        result.reason = 'within checkout limit a'
    } else if (moment(time).isBetween(checkoutLimitA, checkoutLimit)) {
        result.value = 40
        result.reason = 'within checkout limit a and limit'
        if (attendance.status === attendanceStates.checkedInAgain || attendance.status === attendanceStates.checkedIn) {
            result.value = 60
            result.reason = result.reason + ', still to checkout'

            if (status === timeLogType.checkOut) {
                result.value = 80
                result.reason = result.reason + ', checked out'
            }
        }
    } else if (moment(time).isBetween(checkInLimit, startTime)) {
        result.value = 40

        result.reason = 'about to start'
        if (status === timeLogType.checkIn) {
            result.value = 80
            result.reason = result.reason + ', checked in'
        } else {
            if (attendance.status === attendanceStates.absent) {
                result.value = 50
                result.reason = result.reason + ', first punch'
            } else if (attendance.status === attendanceStates.checkedInAgain || attendance.status === attendanceStates.checkedIn) {
                result.value = 60

                result.reason = result.reason + ', not the first one'
                if (status === timeLogType.checkOut) {
                    result.value = 90
                    result.reason = result.reason + ', checking out'
                }
            }
        }
    }

    return result
}

const getExtendedAttendance = async (timeLogTime, employee, context) => {
    let log = context.logger.start('getExtendedAttendance')
    let time = moment(timeLogTime).subtract(30, 'minutes').toDate()

    let where = {
        employee: employee,
        ofDate: {
            $gte: moment(time).subtract(1, 'day').startOf('day')._d,
            $lt: time
        },
        checkOutExtend: {
            $gte: time
        }
    }
    let extendedAttendance = await db.attendance.findOne(where)
        .populate('employee recentMostTimeLog timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    if (!extendedAttendance || extendedAttendance.isGrace) {
        return null
    }

    log.debug('got extended attendance')
    let nextAttendanceDate = dates.date(extendedAttendance.ofDate).add(1)
    let nextDayShiftType = await shiftTypes.getByDate(nextAttendanceDate, employee.id, context)
    let nextDayStartTime = dates.date(nextAttendanceDate).setTime(nextDayShiftType.startTime)

    if (moment(nextDayStartTime).diff(timeLogTime, 'minutes') > 0 && moment(nextDayStartTime).diff(timeLogTime, 'minutes') < 30) {
        extendedAttendance.isGrace = true
        return extendedAttendance.save()
    }

    return extendedAttendance
}

const getAttendanceByTimeLog = async (timeLog, context) => {
    let log = context.logger.start('services/attendances:getAttendanceByTimeLog')
    let employee = timeLog.employee

    let extendedAttendance = await getExtendedAttendance(
        timeLog.time,
        employee,
        context)

    if (extendedAttendance) {
        return extendedAttendance
    }

    let ongoingAttendance = await getOngoingAttendance(timeLog.time, timeLog.type, employee, context)
    if (ongoingAttendance) {
        return ongoingAttendance
    }

    let shiftType = employee.shiftType
    if (employee.isDynamicShift && timeLog.type) {
        if (timeLog.type === 'checkIn') {
            shiftType = await shiftTypes.getByCheckIn(timeLog.time, context)
        }

        if (timeLog.type === 'checkOut') {
            shiftType = await shiftTypes.getByCheckOut(timeLog.time, context)
        }
    }

    let shift = await shifts.getByTime(timeLog.time, shiftType, context)

    return getAttendanceByShift(employee, shift, context)
}

const clockedMinutes = (attendance, context) => {
    let log = context.logger.start('clockedMinutes')
    let timeSpan = 0 // minutes
    let checkIns = []
    let currentCheckIn

    attendance.timeLogs.forEach(item => {
        if (item.type === timeLogType.checkIn) {
            currentCheckIn = {
                checkIn: item
            }
            checkIns.push(currentCheckIn)
        } else if (item.type === timeLogType.checkOut) {
            currentCheckIn = currentCheckIn || {}
            currentCheckIn.checkOut = item
        }
    })

    checkIns.forEach(item => {
        if (item.checkIn && item.checkOut) {
            timeSpan = timeSpan + moment(item.checkOut.time).diff(moment(item.checkIn.time), 'minutes')
        }
    })

    return timeSpan
}

const calculateStatus = (attendance, context) => {
    let summary = {
        date: attendance.ofDate,
        shift: {
            code: '',
            span: 0,
            startTime: null,
            endTime: null
        },
        count: 0,
        checkIn: null,
        checkOut: null,
        minutes: 0,
        clocked: '',
        hoursWorked: null,
        minutesWorked: null,

        late: null,
        early: null,
        status: null
    }

    for (const log of attendance.timeLogs) {
        if (log.type === timeLogType.checkIn && (!summary.checkIn || summary.checkIn > log.time)) {
            summary.checkIn = log.time
        }

        if (log.type === timeLogType.checkOut && (!summary.checkOut || summary.checkOut < log.time)) {
            summary.checkOut = log.time
        }
    }

    summary.minutes = clockedMinutes(attendance, context)
    summary.hoursWorked = Math.floor(summary.minutes / 60)
    summary.minutesWorked = Math.floor(summary.minutes - summary.hoursWorked * 60)

    let hours = '00'
    if (summary.hoursWorked === 0) {
        hours = '00'
    } else if (summary.hoursWorked < 10) {
        hours = `0${summary.hoursWorked}`
    }

    let minutes = '00'
    if (summary.minutesWorked === 0) {
        minutes = '00'
    } else if (summary.minutesWorked < 10) {
        minutes = `0${summary.minutesWorked}`
    }

    summary.clocked = `${hours}:${minutes}`

    const shiftType = attendance.shift.shiftType
    summary.shift.code = shiftType.code

    if (attendance.checkOut && dates.time(attendance.checkOut).lt(shiftType.endTime)) {
        summary.early = dates.time(attendance.checkOut).span(shiftType.endTime)
    }

    if (attendance.checkIn && dates.time(attendance.checkIn).gt(shiftType.startTime)) {
        summary.late = dates.time(attendance.checkIn).span(shiftType.startTime)
    }

    summary.shift.endTime = dates.date(attendance.ofDate).setTime(shiftType.endTime)
    summary.shift.startTime = dates.date(attendance.ofDate).setTime(shiftType.startTime)

    if (summary.shift.startTime.getTime() > summary.shift.endTime.getTime()) {
        summary.shift.endTime = moment(summary.shift.endTime).add(1, 'day').toDate()
    }

    let shiftSpan = dates.time(summary.shift.endTime).diff(summary.shift.startTime) / 60
    summary.shift.span = shiftSpan

    let workSpan = 0
    if (attendance.checkOut && attendance.checkIn) {
        workSpan = dates.time(attendance.checkOut).diff(attendance.checkIn) / 60
    }

    summary.count = (workSpan / shiftSpan)

    if (summary.count < 0) {
        summary.count = 0
    }

    summary.count = Math.floor(summary.count * 10) / 10

    if (attendance.status === attendanceStates.onLeave) {
        return summary
    }

    summary.status = getStatusByConfig(attendance.employee, attendance.shift, context) || attendanceStates.absent

    if (summary.status === attendanceStates.absent) {
        if ((attendance.checkIn && !attendance.checkOut) ||
            (!attendance.checkIn && attendance.checkOut)) {
            summary.status = attendanceStates.missSwipe
        } else if (attendance.checkIn && attendance.checkOut) {
            summary.status = attendanceStates.present
        }
    }

    if (dates.date(attendance.ofDate).isToday()) {
        let lastTimeLog

        if (attendance.timeLogs.length !== 0) {
            lastTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1]
        }

        if (lastTimeLog && lastTimeLog.type === timeLogType.checkIn) {
            summary.status = attendance.checkOut ? attendanceStates.checkedInAgain : attendanceStates.checkedIn
        }
    }
    return summary
}

exports.reset = async (attendance, options, context) => {
    attendance = await db.attendance.findById(attendance.id).populate([{
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    }, {
        path: 'timeLogs'
    }])

    let employee = attendance.employee
    let date = attendance.ofDate

    let leaves = await leaveService.getByDate(date, employee, context)
    let leaveSummary = leaveService.getDaySummary(leaves, date, context)

    attendance.timeLogs = await timeLogService.resetTimeLogs(attendance.timeLogs, context)

    let dayStatus = calculateStatus(attendance, context)

    if (leaveSummary.code) {
        attendance.status = attendanceStates.onLeave
    }

    attendance.checkIn = dayStatus.checkIn
    attendance.checkOut = dayStatus.checkOut
    attendance.minutes = dayStatus.minutes
    attendance.count = dayStatus.count
    attendance.hoursWorked = dayStatus.hoursWorked
    attendance.minsWorked = dayStatus.minutesWorked

    if (attendance.status !== 'weekOff' || options.removeWeekOff) {
        attendance.status = dayStatus.status
    }

    await attendance.save()
    return attendance
}

exports.getSummary = (leaveSummary, attendance, context) => {
    let summary = {
        code: '',
        first: '',
        second: '',
        count: 0,

        checkIn: null,
        checkOut: null,
        minutes: null,
        clocked: '',
        hoursWorked: null,
        minutesWorked: null,

        attendance: null,
        status: ''
    }

    if (!attendance) {
        return summary
    }

    summary = calculateStatus(attendance, context)
    summary.attendance = attendance
    summary.code = summary.shift.code
    summary.first = 'A'
    summary.second = 'A'

    if (leaveSummary.code) {
        summary.status = attendanceStates.onLeave
        if (leaveSummary.first) {
            summary.first = leaveSummary.code
        }
        if (leaveSummary.second) {
            summary.second = leaveSummary.code
        }
    }

    if (summary.status === attendanceStates.missSwipe) {
        summary.first = 'M'
        summary.second = 'M'
    } else if (summary.status == attendanceStates.present) {
        summary.first = 'P'
        summary.second = 'P'
    }

    if (attendance.checkIn && attendance.checkIn > summary.shift.startTime) {
        let late = dates.time(attendance.checkIn).diff(summary.shift.startTime) / 60
        if (late > summary.shift.span / 4) {
            summary.first = 'A'
        }
    }

    if (attendance.checkOut && attendance.checkOut < summary.shift.endTime) {
        let early = dates.time(attendance.checkOut).diff(summary.shift.endTime) / 60
        if (early > summary.shift.span / 4) {
            summary.second = 'A'
        }
    }

    return summary
}

exports.updateByTimeLog = async (timeLog, context) => {
    let log = context.logger.start(`services/attendances:updateByTimeLog(${timeLog.id})`)

    let attendance = await getAttendanceByTimeLog(timeLog, context)

    let timeLogs = []
    if (attendance.timeLogs && attendance.timeLogs.length !== 0) {
        attendance.timeLogs.forEach(item => {
            timeLogs.push(item)
        })
    }

    if (!timeLogs.find(item => item.id === timeLog.id)) {
        timeLogs.push(timeLog)
    }

    log.debug(`resetting '${timeLogs.length}' timeLog(s)`)

    attendance.timeLogs = await timeLogService.resetTimeLogs(timeLogs, context)

    let summary = calculateStatus(attendance, context)
    attendance.checkIn = summary.checkIn
    attendance.checkOut = summary.checkOut

    attendance.count = summary.count
    attendance.minutes = summary.minutes
    attendance.hoursWorked = summary.hoursWorked
    attendance.minsWorked = summary.minutesWorked

    let oldStatus = attendance.status

    if (attendance.status !== 'weekOff') {
        attendance.status = summary.status
    }

    if (attendance.timeLogs.length !== 0) {
        attendance.recentMostTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1]
    }

    await attendance.save()

    if (oldStatus === attendance.status) {
        return attendance
    }

    log.debug(`attendance status changed from '${oldStatus}' to '${attendance.status}'`)

    await offline.queue('attendance', attendance.status, { id: attendance.id }, context)

    return attendance
}
