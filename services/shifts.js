'use strict'
const moment = require('moment')
const shiftTypes = require('../services/shift-types')
const logger = require('@open-age/logger')('services.shifts')

const employeeService = require('../services/employee-getter')

const dates = require('../helpers/dates')
const db = require('../models')

const states = {
    working: 'working',
    weekOff: 'weekOff',
    holiday: 'holiday'
}

exports.states = states

exports.getShiftStatus = async (shiftType, date) => {
    let todayIs = dates.date(date).day()

    if (shiftType[todayIs] === 'off') {
        return states.weekOff
    }

    if (shiftType[todayIs] === 'full') {
        return states.working
    }

    if (shiftType[todayIs] === 'alternate') {
        let lastWeek = dates.date(date).previousWeek()

        let shift = await db.shift.findOne({
            shiftType: shiftType._id,
            date: {
                $gte: lastWeek,
                $lt: dates.date(lastWeek).nextBod()
            }
        })
            .select('status')
        return (shift.status === states.working) ? states.weekOff : states.working
    }

    return states.working
}

exports.getDayStatus = async (shiftType, date) => {
    let todaysDate = dates.date(date).bod()

    let holiday = await db.holiday.findOne({
        status: 'active',
        organization: shiftType.organization,
        tenant: shiftType.tenant,
        date: todaysDate
    })

    if (holiday) {
        return {
            status: states.holiday,
            holiday: holiday
        }
    }
    return {
        status: await this.getShiftStatus(shiftType, date)
    }
}

const getOrCreate = async (shiftType, date, fromDate, isDate, toDate, context) => {
    let log = logger.start('getOrCreate')

    let getQuery = {
        shiftType: shiftType,
        $or: [{
            date: {
                $gte: fromDate,
                $lte: isDate
            }
        }, {
            date: {
                $gte: isDate,
                $lte: toDate
            }
        }]
    }

    return db.shift.findOne(getQuery).then(shift => {
        if (shift) { return shift }

        return shiftTypes.getDayStatus(shiftType, date).then(status => {
            return new db.shift({
                shiftType: shiftType,
                date: dates.date(date).setTime(shiftType.startTime),
                status: status
            }).save().then(shift => {
                log.debug(`new ${shiftType.name} shift (id: '${shift.id}') created for date: '${date}'`)
                return shift
                // return offline.queue("shift", "create", { id: shift.id }, context)
                //     .then(() => shift);
            })
        })
    })
}

let getUpperShift = async (time, shiftType, context) => {
    let isDate = moment(time).add(-19, 'hour')._d

    let setForLess = moment(isDate)
        .set('hour', moment(shiftType.startTime).hours())
        .set('minute', moment(shiftType.startTime).minutes())
        .set('second', 0).set('millisecond', 0)._d

    let fromDate = moment(time)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)
        .subtract(1, 'day')._d

    let toDate = moment(time)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)._d

    return getOrCreate(shiftType, setForLess, fromDate, isDate, toDate, context)
}

let getLowerShift = async (time, shiftType, context) => {
    let isDate = moment(time)
        .add(5, 'hour')._d

    let setForMore = moment(time) // was isDate
        .set('hour', moment(shiftType.startTime).hours())
        .set('minute', moment(shiftType.startTime).minutes())
        .set('second', 0)
        .set('millisecond', 0)._d

    let fromDate = moment(time)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)._d

    let toDate = moment(time)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)
        .add(1, 'day')._d

    return getOrCreate(shiftType, setForMore, fromDate, isDate, toDate, context)
}

exports.getSummary = (shift, context) => {
    const shiftType = shift.shiftType

    let summary = {
        code: shiftType.code,
        endTime: dates.date(shift.date).setTime(shiftType.endTime),
        startTime: dates.date(shift.date).setTime(shiftType.startTime)
    }

    if (summary.startTime.getTime() > summary.endTime.getTime()) {
        summary.endTime = moment(summary.endTime).add(1, 'day').toDate()
    }

    let shiftSpan = dates.time(summary.endTime).diff(summary.startTime) / 60
    var breakTime = shiftType.breakTime || 0

    summary.span = shiftSpan

    if (!context.getConfig('shift.span.ignoreBreak')) {
        summary.span = summary.span - breakTime
    }

    return summary
}

exports.reset = async (shift, context) => {
    const dayStatus = await this.getDayStatus(shift.shiftType, shift.date, context)
    if (shift.status !== dayStatus.status) {
        shift.status = dayStatus.status
        await shift.save()
    }

    return shift
}

exports.shiftByShiftType = async (shiftType, date, context) => {
    shiftType = await shiftTypes.get(shiftType, context)
    let shift = await db.shift.findOne({
        shiftType: shiftType,
        date: {
            $gte: dates.date(date).bod(),
            $lt: dates.date(date).eod()
        }
    }).populate('shiftType')

    if (shift) {
        return shift
    }

    let shiftStatus = await this.getDayStatus(shiftType, date)

    shift = new db.shift({
        shiftType: shiftType.id || shiftType,
        status: shiftStatus.status,
        holiday: shiftStatus.holiday,
        date: dates.date(date).setTime(shiftType.startTime)
    })

    await shift.save()

    context.logger.info(`new shift created for ${date}`)

    return shift
}

exports.getByTime = async (time, shiftType, context) => {
    let log = logger.start('getByTime')
    shiftType = await shiftTypes.get(shiftType, context)
    let shiftA = await getUpperShift(time, shiftType, context)
    let shiftB = await getLowerShift(time, shiftType, context)

    shiftA.shiftType = shiftType // old
    shiftB.shiftType = shiftType // new

    let shiftBStartTime = moment(shiftB.date)
        .set('hour', moment(shiftType.startTime).hours())
        .set('minute', moment(shiftType.startTime).minutes())
        .set('second', moment(shiftType.startTime).seconds())
        .set('millisecond', moment(shiftType.startTime).milliseconds())

    let checkBoolean1 = moment(time).isBefore(moment(shiftBStartTime).subtract(5, 'hours'))
    let shift = checkBoolean1 ? shiftA : shiftB

    log.debug(`found shift with date: '${shift.date}' as the most relevant ${shiftType.name} shift for time: '${time}'`)
    return shift
}

exports.getByTimeLog = async (timeLog, employee, context) => {
    let shiftType = employee.shiftType

    if (employee.isDynamicShift && timeLog.type) {
        if (timeLog.type === 'checkIn') {
            shiftType = await shiftTypes.getByCheckIn(timeLog.time, employee, context)
        }

        if (timeLog.type === 'checkOut') {
            shiftType = await shiftTypes.getByCheckOut(timeLog.time, employee, context)
        }
    }

    return exports.getByTime(timeLog.time, shiftType, context)
}

exports.getByDate = async (date, employee, context) => {
    context.logger.debug('getting shift by roaster')

    employee = await employeeService.get(employee, context)
    let shiftType = employee.shiftType
    let previousShift = await db.effectiveShift.findOne({
        employee: employee.id,
        date: {
            $lte: dates.date(date).bod()
        }
    }).sort({
        date: -1
    }).populate('shiftType')

    if (previousShift) {
        shiftType = previousShift.shiftType
    }

    return exports.shiftByShiftType(shiftType, date, context)
}

/**
 * String
 * { id: String}
 * { shiftType: {id: String}, date: Date }
 * { shiftType: {id: String}, time: Date }
 * { employee: {id: String}, date: Date }
 * { employee: {id: String}, timeLog: {time: Date, type: String} }
 *
*/
exports.get = async (query, context) => {
    context.logger.start('services/shifts:get')

    if (query._doc) {
        return query
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.shift.findById(query).populate('shiftType')
    }
    if (query.id) {
        return db.shift.findById(query.id).populate('shiftType')
    }
    if (query.shiftType) {
        if (query.date) {
            return exports.shiftByShiftType(query.shiftType, query.date, context)
        }
        if (query.time) {
            return exports.getByTime(query.time, query.shiftType, context)
        }
    }
    if (query.employee) {
        if (query.date) {
            return exports.getByDate(query.date, query.employee, context)
        }
        if (query.timeLog) {
            return exports.getByTimeLog(query.timLog, query.employee, context)
        }
    }
    return null
}
