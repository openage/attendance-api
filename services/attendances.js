'use strict'
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const shifts = require('./shifts')
const shiftTypes = require('./shift-types')
const monthlySummaries = require('./monthly-summaries')
const weeklySummaries = require('./weekly-summaries')
const db = require('../models')

const employees = require('./employee-getter')
const leaveService = require('./leaves')
const dates = require('../helpers/dates')

const timeLogService = require('./time-logs')
const leaveBalanceService = require('./leave-balances')

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
    // missSwipe: 'missSwipe',
    halfday: 'halfday',
    weekOff: 'weekOff',
    holiday: 'holiday',
    checkedInAgain: 'checked-in-again'
}

var inStates = {
    early: 'early',
    late: 'late',
    missed: 'missed'
}

var outStates = {
    early: 'early',
    late: 'late',
    missed: 'missed'
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

const getAttendanceByShift = async (employee, shift, options, context) => {
    options = options || {}
    context.logger.debug('services/attendances:getAttendanceByShift')
    const date = dates.date(shift.date).bod()
    let attendance = await db.attendance.findOne({
        employee: employee,
        ofDate: date
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
    } else if (!options.create) {
        return null
    }

    const lock = await context.lock(`employees/${employee.id}/attendances/${date}/new`)

    attendance = await db.attendance.findOne({
        employee: employee,
        ofDate: date
    }).populate('employee recentMostTimeLog timeLogs').populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    if (!attendance) {
        attendance = new db.attendance({
            employee: employee,
            status: attendanceStates.absent,
            shift: shift,
            shiftType: shift.shiftType,
            ofDate: date,
            organization: context.organization,
            tenant: context.tenant
        })

        attendance.status = getStatusByConfig(employee, shift, context) || attendanceStates.absent

        if (shift.shiftType.autoExtend) {
            attendance.checkOutExtend = dates.time(shifts.getSummary(shift, context).endTime).add(shift.shiftType.grace.checkOut.late)
        }

        await attendance.save()
        context.logger.debug(`created new attendance with status ${attendance.status}`)
    } else if (attendance.shift.id !== shift.id) {
        attendance.shift = shift
        await attendance.save()
    }
    lock.release()
    return attendance
}

exports.getAttendanceByShift = getAttendanceByShift

const merge = async (date, employee, context) => {
    context.logger.debug('services/attendances:merge')

    const ofDate = dates.date(date).bod()

    let attendance = null

    const lock = await context.lock(`employees/${employee.id}/attendances/${ofDate}/merge`)

    let attendances = await db.attendance.find({
        ofDate: ofDate,
        employee: employee
    }).populate('employee timeLogs').populate({
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    })

    if (attendances && attendances.length) {
        attendance = attendances[attendances.length - 1]

        if (attendances.length > 1) {
            attendances.forEach(item => {
                if (item.timeLogs && item.timeLogs.length) {
                    attendance = item
                }
            })

            let ids = []
            attendances.forEach(item => {
                if (item.id !== attendance.id) {
                    ids.push(item.id)
                }
            })

            await db.attendance.remove({
                _id: {
                    $in: ids
                }
            })
        }
    }

    lock.release()

    return attendance
}

const getAttendanceByDate = async (date, employee, options, context) => {
    employee = await employees.get(employee, context)

    let thisDate = dates.date(date).bod()

    let attendances = await db.attendance.find({
        ofDate: thisDate,
        employee: employee
    })
        .populate('employee recentMostTimeLog')
        .populate({
            path: 'timeLogs',
            populate: {
                path: 'device'
            }
        })
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    let attendance = null
    if (attendances) {
        if (attendances.length === 1) {
            attendance = attendances[0]
        } else if (attendances.length > 1) {
            attendance = await merge(thisDate, employee, context)
        }
    }

    if (attendance) {
        return attendance
    }

    let shiftType = await shiftTypes.getByDate(date, employee.id, context)

    if (shiftType.autoExtend) {
        let previousDate = dates.date(date).bod({ subtract: 1 })
        let previouseAttendances = await db.attendance.find({
            ofDate: previousDate,
            employee: employee
        })
            .populate('employee recentMostTimeLog')
            .populate({
                path: 'timeLogs',
                populate: {
                    path: 'device'
                }
            })
            .populate({
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            })

        let previousAttendance = null
        if (previouseAttendances) {
            if (previouseAttendances.length === 1) {
                previousAttendance = previouseAttendances[0]
            } else if (previouseAttendances.length > 1) {
                previousAttendance = await merge(previousDate, employee, context)
            }
        }

        if (previousAttendance) {
            return previousAttendance
        }
    }

    let shift = await shifts.shiftByShiftType(shiftType, date, context)

    return getAttendanceByShift(employee, shift, options, context)
}

exports.getAttendanceByDate = getAttendanceByDate

const get = async (query, context) => {
    context.logger.debug('services/attendances:get')

    if (!query) {
        return null
    }

    if (query._doc) {
        return query
    }

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

    if (query.date && (query.employee || query.user)) {
        return getAttendanceByDate(query.date, (query.employee || query.user), {
            create: true
        }, context)
    }

    if (query.shift && (query.employee || query.user)) {
        return getAttendanceByShift((query.employee || query.user), query.shift, {
            create: true
        }, context)
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

exports.clearNeedAction = async (attendanceId, context) => {
    let attendance = await db.attendance.findById(attendanceId)
    attendance.needsAction = null
    return attendance.save()
}

const getOngoingAttendance = async (timeLog, employee, options, context) => {
    let time = timeLog.time
    let log = context.logger.start('services/attendances:getOngoingAttendance')

    let previousDay = dates.date(time).previousBod()
    let thisDay = dates.date(time).bod()

    let latestAttendance = await getAttendanceByDate(thisDay, employee, options, context)
    let previousAttendance = await getAttendanceByDate(previousDay, employee, options, context)

    let previousMatch
    let latestMatch

    if (previousAttendance && previousAttendance.timeLogs && previousAttendance.timeLogs.length) {
        if (previousAttendance.timeLogs.find(log => log.id === timeLog.id)) {
            return previousAttendance
        }
    }

    if (latestAttendance && latestAttendance.timeLogs && latestAttendance.timeLogs.length) {
        if (latestAttendance.timeLogs.find(log => log.id === timeLog.id)) {
            return latestAttendance
        }
    }
    if (previousAttendance) {
        previousMatch = ofAttendance(timeLog, previousAttendance, context)
        log.debug('previousMatch', previousMatch)
    }

    if (latestAttendance) {
        latestMatch = ofAttendance(timeLog, latestAttendance, context)
        log.debug('latestMatch', latestMatch)
    }

    if (previousMatch && latestMatch && previousMatch.value < 70 && latestMatch.value < 70) {
        if (timeLog.type === timeLogType.checkIn) {
            let late = dates.time(timeLog.time).diff(previousAttendance.checkOut || previousMatch.endTime)
            let early = dates.time(latestMatch.startTime).diff(timeLog.time)

            if (early && late) {
                let gap = 5 * 60 * 60 // 5 hours

                if (late > early && early < gap) {
                    previousMatch.value = 0
                    previousMatch.reason = previousMatch.reason + ' checkIn (0)'
                    latestMatch.value = 80
                    latestMatch.reason = latestMatch.reason + ' checkIn (80)'
                }
            }
        }
    }

    timeLog.decision = {
        previousMatch: previousMatch,
        latestMatch: latestMatch
    }
    await timeLog.save()

    if (!latestMatch && previousMatch && previousMatch.value > 70) {
        return previousAttendance
    }

    if (!previousMatch && latestMatch && latestMatch.value > 70) {
        return latestAttendance
    }

    if (!previousMatch || !latestMatch) {
        return null
    }

    if (previousMatch.value > latestMatch.value) {
        log.debug('using previous match')
        return previousAttendance
    } else {
        log.debug('using latest match')
        return latestAttendance
    }
}

const ofAttendance = (timeLog, attendance, context) => {
    let shiftType = attendance.shift.shiftType

    let graceEarly = context.getConfig('attendance.checkIn.earliest')
    let graceLate = context.getConfig('attendance.checkOut.latest')
    var startTime = dates.date(attendance.ofDate).setTime(shiftType.startTime)

    var endTime = dates.date(attendance.ofDate).setTime(shiftType.endTime)

    if (startTime.getTime() > endTime.getTime()) {
        endTime = dates.date(endTime).add(1, 'day')
    }

    var nextStartTime = dates.date(startTime).add(1)

    var checkoutLimitA = dates.time(endTime).add(graceLate)

    // user can checkout 30 minutes before the next shift starts
    var checkoutLimit = dates.time(nextStartTime).subtract(graceEarly)

    var checkInLimit = dates.time(startTime).subtract(graceEarly)

    let result = {
        checkInLimit: checkInLimit,
        startTime: startTime,
        endTime: endTime,
        checkoutLimitA: checkoutLimitA,
        checkoutLimit: checkoutLimit,
        value: 0,
        reason: 'not set'
    }

    let time = dates.time(timeLog.time)

    if (time.isBetween(startTime, endTime)) {
        result.value = 100
        result.reason = 'isBetween'
    } else if (time.isBetween(endTime, checkoutLimit)) {
        result.value = 40
        result.reason = 'within checkout and next day start - grace'

        if (time.isBetween(endTime, checkoutLimitA)) {
            result.value = result.value + 30
            result.value = result.value + (50 * time.diff(checkoutLimitA) / (60 * graceLate))
            result.reason = result.reason + ', within checkout grace'
        }
        if (attendance.checkOutStatus === outStates.missed) {
            result.value = result.value + 5
            result.reason = result.reason + ', still to checkout'
            if (timeLog.type === timeLogType.checkOut) {
                result.value = result.value + 10
                result.reason = result.reason + ', checked out'
            }
        } else if (attendance.checkInStatus === inStates.missed) {
            result.value = result.value + 5
            result.reason = result.reason + ', still to check-in'
            if (timeLog.type === timeLogType.checkIn) {
                result.value = result.value + 5
                result.reason = result.reason + ', checked in'
            }
        }
    } else if (time.isBetween(checkInLimit, startTime)) {
        result.value = 50 + (50 * time.diff(checkInLimit) / (60 * graceEarly))
        result.reason = 'about to start'
        if (timeLog.type === timeLogType.checkIn) {
            result.value = result.value + 20
            result.reason = result.reason + ', checked in'
        } else {
            if (attendance.status === attendanceStates.absent) {
                result.value = result.value + 10
                result.reason = result.reason + ', first punch'
            } else if (attendance.checkOutStatus === outStates.missed) {
                result.value = result.value + 10
                result.reason = result.reason + ', not the first one'
                if (timeLog.type === timeLogType.checkOut) {
                    result.value = result.value + 10
                    result.reason = result.reason + ', checking out'
                }
            }
        }
    }

    return result
}

const getExtendedAttendance = async (timeLogTime, employee, context) => {
    let log = context.logger.start('services/attendances:getExtendedAttendance')
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

    if (extendedAttendance.checkOut && // has already checked out
        dates.time(extendedAttendance.checkOutExtend).diff(extendedAttendance.checkOut) < 300 && // has checkedout within 5 minutes of extended time
        timeLogTime.getTime() > extendedAttendance.checkOut.getTime()) { // the  time is greater than checkout
        return null
    }

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
    let log = context.logger.start(`services/attendances:getAttendanceByTimeLog(${timeLog.id})`)
    let employee = timeLog.employee

    if (timeLog.attendanceId) {
        log.debug(`getting attendance with ${timeLog.attendanceId}`)

        let attendance = await get({
            id: timeLog.attendanceId
        }, context)

        if (attendance) {
            return attendance
        }
    }

    let extendedAttendance = await getExtendedAttendance(
        timeLog.time,
        employee,
        context)

    if (extendedAttendance) {
        log.debug('returning extended attendance')
        return extendedAttendance
    }

    let ongoingAttendance = await getOngoingAttendance(timeLog, employee, {
        create: !employee.isDynamicShift
    }, context)
    if (ongoingAttendance && (!employee.isDynamicShift || ongoingAttendance.status !== attendanceStates.absent)) {
        log.debug('returning ongoing attendance')
        return ongoingAttendance
    }

    let shift = await shifts.getByTimeLog(timeLog, employee, context)

    log.debug('returning extended getAttendanceByShift')

    return getAttendanceByShift(employee, shift, {
        create: true
    }, context)
}

const calculateStatus = (attendance, options, context) => {
    let logger = context.logger.start({
        location: 'services/attendances:calculateStatus',
        attendance: attendance.id
    })
    options = options || {}
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
        needsAction: null,
        hours: null,
        overTime: 0,

        late: null,
        early: null,
        status: null,
        first: 'A',
        second: 'A',

        checkInStatus: null,
        checkOutStatus: null
    }

    let checkIncheckOut = timeLogService.getCheckInCheckOut(attendance.timeLogs, context)
    summary.checkIn = checkIncheckOut.checkIn
    summary.checkOut = checkIncheckOut.checkOut

    summary.minutes = timeLogService.getClockedMinutes(attendance.timeLogs, context)
    summary.hoursWorked = Math.floor(summary.minutes / 60)
    summary.minutesWorked = Math.floor(summary.minutes - summary.hoursWorked * 60)
    summary.clocked = dates.minutes(summary.minutes).toString()

    summary.shift = shifts.getSummary(attendance.shift, context)

    const oldStatus = attendance.status

    summary.status = getStatusByConfig(attendance.employee, attendance.shift, context) || attendanceStates.absent

    let inStatus = checkInStatus(attendance, summary, context)
    let outStatus = checkOutStatus(attendance, summary, context)
    summary.checkInStatus = inStatus.status
    summary.checkOutStatus = outStatus.status

    summary.late = inStatus.status === inStates.late ? inStatus.diff : 0
    summary.early = outStatus.status === outStates.early ? outStatus.diff : 0

    if (summary.checkIn || summary.checkOut) {
        summary.status = attendanceStates.present
    }

    if (summary.status == attendanceStates.present) {
        summary.first = 'P'
        summary.second = 'P'
    }

    if (summary.checkInStatus && summary.checkInStatus !== inStates.early && summary.first === 'P') {
        summary.first = 'A'
    }

    if (summary.checkOutStatus && summary.checkOutStatus !== outStates.late && summary.second === 'P') {
        summary.second = 'A'
    }

    if (oldStatus === attendanceStates.onLeave && options.onLeave) {
        summary.status = oldStatus
    }

    let workSpan = summary.minutes
    if (summary.checkOut && summary.checkIn && context.getConfig('attendance.overtime') !== 'clocked') {
        workSpan = Math.floor(dates.time(summary.checkOut).diff(summary.checkIn) / 60)
    }

    summary.overTime = attendance.status === attendanceStates.present ? Math.floor(workSpan - summary.shift.span) : workSpan

    if (summary.overTime <= 0) {
        summary.overTime = 0
        summary.count = workSpan / summary.shift.span
    } else {
        let spanExtra = context.getConfig('shift.span.extra') || summary.shift.span

        summary.count = (summary.overTime / spanExtra)

        if (attendance.status === attendanceStates.present) {
            summary.count++
        }
    }

    summary.count = Math.floor(summary.count * 10) / 10

    if (summary.count < 1) {
        summary.hours = 'short'
    }

    if (summary.count >= 1) {
        summary.hours = 'extra'
    }

    logger.debug(summary)
    logger.end()
    return summary
}

const getSummary = (leaveSummary, attendance, context) => {
    context.logger.debug('services/attendances:getSummary')
    let summary = {
        code: '',
        first: 'A',
        second: 'A',
        count: 0,

        checkIn: null,
        checkOut: null,
        minutes: null,
        overTime: 0,
        clocked: '',
        hoursWorked: null,
        minutesWorked: null,

        attendance: null,
        status: ''
    }

    if (!attendance) {
        return summary
    }

    summary = calculateStatus(attendance, {
        onLeave: !!leaveSummary.code
    }, context)
    summary.attendance = attendance
    summary.code = summary.shift.code

    if (leaveSummary.code) {
        summary.status = attendanceStates.onLeave
        if (leaveSummary.first) {
            summary.first = leaveSummary.code
        }
        if (leaveSummary.second) {
            summary.second = leaveSummary.code
        }
    }

    // if (summary.status === attendanceStates.missSwipe) {
    //     summary.first = 'M'
    //     summary.second = 'M'
    // } else

    return summary
}
exports.getSummary = getSummary

const reset = async (attendance, options, context) => {
    let log = context.logger.start({
        location: `services/attendances/reset`,
        attendance: attendance.id
    })
    options = options || {}
    attendance = await exports.get(attendance, context)

    let oldStatus = attendance.status

    let employee = attendance.employee
    if (options.recalculateShift === undefined) {
        options.recalculateShift = !!employee.isDynamicShift
    }
    if (options.adjustTimeLogs) {
        let firstLog = attendance.timeLogs && attendance.timeLogs.length ? attendance.timeLogs[0] : null

        if (firstLog && firstLog.type === timeLogType.checkOut) {
            let previous = await db.attendance.findOne({
                employee: employee,
                ofDate: dates.date(attendance.ofDate).previousBod()
            }).populate([{
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            }, {
                path: 'timeLogs'
            }])

            let lastDayLog = previous && previous.timeLogs && previous.timeLogs.length ? previous.timeLogs[previous.timeLogs.length - 1] : null

            // should first log move to previous attendance
            if (lastDayLog &&
                lastDayLog.type === timeLogType.checkIn &&
                dates.time(firstLog.time).diff(lastDayLog.time) < 43200 // 12 hours
            ) {
                log.info(`moving firstLog ${firstLog.time} to previous day`)
                let afterFirstRemoved = []
                attendance.timeLogs.forEach(item => {
                    if (item.id !== firstLog.id) {
                        afterFirstRemoved.push(item)
                    }
                })

                attendance.timeLogs = afterFirstRemoved
                previous.timeLogs.push(firstLog)
                firstLog.attendanceId = previous.id.toString()
                await firstLog.save()
                previous.timeLogs = await timeLogService.resetTimeLogs(previous.timeLogs, context)
                await setStatus(previous, options, context)
                await previous.save()
            }
        }

        let lastLog = attendance.timeLogs && attendance.timeLogs.length ? attendance.timeLogs[attendance.timeLogs.length - 1] : null

        if (lastLog && lastLog.type === timeLogType.checkIn && !dates.date(lastLog.time).isSame(attendance.ofDate)) {
            let next = await db.attendance.findOne({
                employee: employee,
                ofDate: dates.date(attendance.ofDate).nextBod()
            }).populate([{
                path: 'shift',
                populate: {
                    path: 'shiftType'
                }
            }, {
                path: 'timeLogs'
            }])

            let nextDayLog = next && next.timeLogs && next.timeLogs.length ? next.timeLogs[0] : null

            // should last log move to next attendance
            if (nextDayLog &&
                nextDayLog.type === timeLogType.checkOut &&
                dates.time(nextDayLog.time).diff(lastLog.time) < 43200 // 12 hours
            ) {
                log.info(`moving lastLog ${lastLog.time} to next day`)

                let afterLastRemoved = []
                attendance.timeLogs.forEach(item => {
                    if (item.id !== lastLog.id) {
                        afterLastRemoved.push(item)
                    }
                })

                attendance.timeLogs = afterLastRemoved
                next.timeLogs.push(lastLog)
                lastLog.attendanceId = next.id.toString()
                await lastLog.save()
                next.timeLogs = await timeLogService.resetTimeLogs(next.timeLogs, context)
                await setStatus(next, options, context)
                await next.save()
            }
        }
    }

    attendance.timeLogs = await timeLogService.resetTimeLogs(attendance.timeLogs, context)

    await setStatus(attendance, options, context)

    await attendance.save()
    await leaveBalanceService.runOvertimeRules(attendance, {}, context)
    // await weeklySummaries.addAttendance(attendance, context)
    await monthlySummaries.addAttendance(attendance, context)
    log.end()

    if (oldStatus === attendance.status) {
        return attendance
    }

    log.debug(`attendance status changed from '${oldStatus}' to '${attendance.status}'`)
    await offline.queue('attendance', attendance.status, attendance, context)
    return attendance
}
exports.reset = reset

const setStatus = async (attendance, options, context) => {
    context.logger.debug('services/attendances:setStatus')
    options = options || {}
    let employee = attendance.employee
    let date = attendance.ofDate

    if (options.recalculateShift) {
        if (attendance.timeLogs && attendance.timeLogs.length && employee.isDynamicShift) {
            attendance.shift = await shifts.getByTimeLog(attendance.timeLogs[0], employee, context)
        } else {
            attendance.shift = await shifts.getByDate(attendance.ofDate, employee, context)
        }
    }

    let leaves = await leaveService.getByDate(date, employee, context)
    let leaveSummary = leaveService.getDaySummary(leaves, date, context)

    let dayStatus = getSummary(leaveSummary, attendance, context)

    if (leaveSummary.code) {
        attendance.status = attendanceStates.onLeave
    }

    attendance.checkIn = dayStatus.checkIn
    attendance.checkInStatus = dayStatus.checkInStatus
    attendance.firstHalfStatus = dayStatus.first
    attendance.late = dayStatus.late

    attendance.checkOut = dayStatus.checkOut
    attendance.checkOutStatus = dayStatus.checkOutStatus
    attendance.secondHalfStatus = dayStatus.second
    attendance.early = dayStatus.early

    attendance.minutes = dayStatus.minutes
    attendance.count = dayStatus.count
    attendance.hoursWorked = dayStatus.hoursWorked
    attendance.minsWorked = dayStatus.minutesWorked
    attendance.hours = dayStatus.hours
    attendance.overTime = dayStatus.overTime

    if (attendance.status !== 'weekOff' || options.removeWeekOff) {
        attendance.status = dayStatus.status
    }

    if (attendance.timeLogs.length !== 0) {
        attendance.recentMostTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1]
    }
}

exports.setStatus = setStatus

exports.setShift = async (date, employee, shiftType, context) => {
    context.logger.debug(`services/attendances:setShift`)
    let attendance = await getAttendanceByDate(date, employee, {
        create: true
    }, context)
    let shift = await shifts.shiftByShiftType(shiftType, date, context)

    attendance.shift = shift
    await attendance.save()
    return attendance
}

exports.moveTimeLog = async (item, from, to, context) => {
    context.logger.debug('services/attendances:moveTimeLog')
    let removedTimeLogs = []
    let timeLog = await db.timeLog.findById(item.id)
    let attendance = await db.attendance.findById(from.id)
        .populate('employee')
        .populate({
            path: 'timeLogs',
            populate: {
                path: 'device'
            }
        })
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    attendance.timeLogs.forEach(item => {
        if (item.id !== timeLog.id) {
            removedTimeLogs.push(item)
        }
    })

    attendance.timeLogs = removedTimeLogs
    await attendance.save()
    let newAttendance = await getAttendanceByDate(to.ofDate, attendance.employee, {
        create: true
    }, context)

    newAttendance.timeLogs = newAttendance.timeLogs || []
    newAttendance.timeLogs.push(timeLog)
    await newAttendance.save()

    timeLog.attendanceId = newAttendance.id.toString()
    await timeLog.save()

    await reset(attendance, null, context)
    await reset(newAttendance, null, context)
}

exports.updateByTimeLog = async (timeLog, context) => {
    if (!timeLog) {
        context.logger.error(`services/attendances:updateByTimeLog - timeLog does not exist`)
        throw new Error('timeLog does not exist')
    }

    context.logger.debug(`services/attendances:updateByTimeLog(${timeLog.id})`)
    let attendance = await getAttendanceByTimeLog(timeLog, context)

    if (!attendance) {
        context.logger.error(`services/attendances:updateByTimeLog - attendance does not exist (log: ${timeLog.id})`)
        throw new Error('attendance does not exist')
    }

    return addTimeLog(timeLog, attendance, context)
}

const addTimeLog = async (timeLog, attendance, context) => {
    let logger = context.logger.start({
        location: 'services/attendances:addTimeLog',
        timeLog: timeLog.id,
        attendance: attendance.id
    })
    let timeLogs = []
    if (attendance.timeLogs && attendance.timeLogs.length !== 0) {
        attendance.timeLogs.forEach(item => {
            timeLogs.push(item)
        })
    }

    if (!timeLogs.find(item => item.id === timeLog.id)) {
        timeLogs.push(timeLog)
    }

    timeLog.attendanceId = attendance.id.toString()
    await timeLog.save()
    attendance.timeLogs = timeLogs
    return reset(attendance, {
        adjustTimeLogs: context.getConfig('timeLog.add.adjust')
    }, context)
}

exports.addTimeLog = addTimeLog

const checkInStatus = (attendance, summary, context) => {
    context.logger.debug('services/attendances:checkInStatus')
    if (!summary.checkIn) {
        return {
            diff: 0,
            status: inStates.missed
        }
    }

    let timeLogs = attendance.timeLogs.filter(item => !item.ignore)
    var checkInCount = 0
    var checkOutCount = 0
    for (let timeLog of timeLogs) {
        if (timeLog.type === timeLogType.checkIn) {
            checkInCount = checkInCount + 1
        } else {
            checkOutCount = checkOutCount + 1
        }
    }

    if (checkInCount < checkOutCount) {
        return {
            diff: 0,
            status: inStates.missed
        }
    }

    let diff = dates.time(summary.checkIn).diff(summary.shift.startTime, true) / 60
    let grace = (attendance.shift.shiftType.grace || {}).checkIn || {}
    diff = Math.floor(diff)

    if (grace.early && -diff > grace.early) {
        return {
            diff: diff,
            status: inStates.early
        }
    }
    if (grace.late && diff > grace.late) {
        return {
            diff: diff,
            status: inStates.late
        }
    }
    return {
        diff: diff,
        status: null
    }
}

const checkOutStatus = (attendance, summary, context) => {
    context.logger.debug('services/attendances:checkOutStatus')
    let timeLogs = attendance.timeLogs.filter(item => !item.ignore)

    let lastLog = timeLogs[timeLogs.length - 1]
    if (lastLog) {
        if (lastLog.type === timeLogType.checkIn) {
            return {
                diff: 0,
                status: outStates.missed
            }
        }
    }
    if (timeLogs.length < 1) {
        return {
            diff: 0,
            status: outStates.missed
        }
    }

    var checkInCount = 0
    var checkOutCount = 0
    for (let timeLog of timeLogs) {
        if (timeLog.type === timeLogType.checkIn) {
            checkInCount = checkInCount + 1
        } else {
            checkOutCount = checkOutCount + 1
        }
    }
    if (checkInCount > checkOutCount) {
        return {
            diff: 0,
            status: outStates.missed
        }
    }

    let diff = dates.time(summary.checkOut).diff(summary.shift.endTime, true) / 60
    diff = Math.floor(diff)

    let grace = attendance.shift.shiftType.grace.checkOut

    if (grace.early && -diff > grace.early) {
        return {
            diff: diff,
            status: outStates.early
        }
    }
    if (grace.late && diff > grace.late) {
        return {
            diff: diff,
            status: outStates.late
        }
    }
    return {
        diff: diff,
        status: null
    }
}

exports.getOneDayAttendances = async (page, query, context) => {
    let finder = [{
        $lookup: {
            from: 'shifts',
            localField: 'shift',
            foreignField: '_id',
            as: 'currentShift'
        }
    }, {
        $unwind: '$currentShift'
    }, {
        $lookup: {
            from: 'shifttypes',
            localField: 'currentShift.shiftType',
            foreignField: '_id',
            as: 'shiftType'
        }
    }, {
        $unwind: '$shiftType'
    }, {
        $lookup: {
            from: 'employees',
            localField: 'employee',
            foreignField: '_id',
            as: 'emp'
        }
    }, {
        $unwind: '$emp'
    }, {
        $match: query
    }, {
        $sort: {
            'employee.code': 1
        }
    },
    {
        $unwind: {
            path: '$timeLogs',
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $lookup: {
            from: 'timelogs',
            localField: 'timeLogs',
            foreignField: '_id',
            as: 'timeLogItem'
        }
    },
    {
        $unwind: {
            path: '$timeLogItem',
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $group: {
            _id: '$_id',
            status: {
                $first: '$status'
            },
            ofDate: {
                $first: '$ofDate'
            },
            checkIn: {
                $first: '$checkIn'
            },
            checkOut: {
                $first: '$checkOut'
            },
            checkOutExtend: {
                $first: '$checkOutExtend'
            },
            count: {
                $first: '$count'
            },
            overTime: {
                $first: '$overTime'
            },
            late: {
                $first: '$late'
            },
            early: {
                $first: '$early'
            },
            hours: {
                $first: '$hours'
            },
            minutes: {
                $first: '$minutes'
            },
            clocked: {
                $first: '$clocked'
            },
            checkInStatus: {
                $first: '$checkInStatus'
            },
            checkOutStatus: {
                $first: '$checkOutStatus'
            },
            firstHalfStatus: {
                $first: '$firstHalfStatus'
            },
            secondHalfStatus: {
                $first: '$secondHalfStatus'
            },
            hoursWorked: {
                $first: '$hoursWorked'
            },
            minsWorked: {
                $first: '$minsWorked'
            },
            units: {
                $first: '$units'
            },
            isGrace: {
                $first: '$isGrace'
            },
            employee: {
                $first: '$emp'
            },
            team: {
                $first: '$team'
            },
            shift: {
                $first: '$currentShift'
            },
            shiftType: {
                $first: '$shiftType'
            },
            timeLogs: {
                $push: '$timeLogItem'
            }
        }
    },
    {
        $sort: {
            'employee.code': 1
        }
    }

    ]

    if (page) {
        finder.push({
            $skip: page.skip

        })
        finder.push({
            $limit: page.limit
        })
    }

    let attendances = await db.attendance.aggregate(finder).allowDiskUse(true)

    attendances = attendances.map(item => {
        item.shift.shiftType = item.shiftType
        return item
    })

    attendances = attendances.sort((a, b) => {
        return (parseInt(a.employee.code) - parseInt(b.employee.code))
    })

    return attendances
}

exports.search = async (query, paging, context) => {
    let where = {
        organization: context.organization
    }

    if (query.user) {
        where.employee = await employees.get(query.user, context)
    } else {
        where.employee = context.user.id
    }

    if (query.ofDate) {
        where.ofDate = query.ofDate
    } else if (query.fromDate && query.toDate) {
        where.ofDate = {
            $gte: dates.date(query.fromDate).bod(),
            $lt: dates.date(query.toDate).eod()
        }
    } else {
        where.ofDate = dates.date(new Date()).bod()
    }

    let attendances = await db.attendance.find(where)
        .populate('timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType holiday'
            }
        }).sort({
            ofDate: 1
        })

    return {
        items: attendances
    }
}
