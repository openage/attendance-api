'use strict'
const moment = require('moment')
const shiftTypes = require('../services/shift-types')
const logger = require('@open-age/logger')('services.shifts')

const dates = require('../helpers/dates')
const db = require('../models')

const states = {
    working: 'working',
    weekOff: 'weekOff',
    holiday: 'holiday'
}

exports.states = states

let getShiftStatus = async (shiftType, date) => {
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

let getDayStatus = async (shiftType, date) => {
    let todaysDate = dates.date(date).bod()

    let holiday = await db.holiday.findOne({
        organization: shiftType.organization,
        date: todaysDate
    })

    if (holiday) {
        return {
            status: states.holiday,
            holiday: holiday
        }
    }
    return {
        status: await getShiftStatus(shiftType, date)
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
                date: date,
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

exports.shiftByShiftType = async (shiftType, date, context) => {
    let shift = await db.shift.findOne({
        shiftType: shiftType.id,
        date: {
            $gte: dates.date(date).bod(),
            $lt: dates.date(date).eod()
        }
    })

    if (shift) {
        return shift
    }

    let shiftStatus = await getDayStatus(shiftType, date)

    shift = new db.shift({
        shiftType: shiftType._id,
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
    return Promise.all([
        getUpperShift(time, shiftType, context), getLowerShift(time, shiftType, context)
    ]).spread((shiftA, shiftB) => {
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
    })
}

exports.getShiftStatus = getShiftStatus
exports.getDayStatus = getDayStatus
