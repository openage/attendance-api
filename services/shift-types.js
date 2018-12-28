'use strict'
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const dates = require('../helpers/dates')
const db = require('../models')

const get = async (query, context) => {
    let log = context.logger.start('services/shiftTypes:get')
    let where = {
        organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.shiftType.findById(query)
        }
        where['code'] = query
        return db.shiftType.findOne(where)
    }
    if (query.id) {
        return db.shiftType.findById(query.id)
    }
    if (query.code) {
        where['code'] = query.code
        return db.shiftType.findOne(where)
    }
    let error = new Error(`invalid query '${query}'`)
    log.error(error)

    throw error
}

exports.get = get

exports.create = (model, callback) => {
    var data = {
        code: model.code,
        name: model.name || model.code,
        startTime: model.startTime || moment().set('hour', 9).set('minute', 0).set('second', 0).set('millisecond', 0),
        endTime: model.endTime || moment().set('hour', 18).set('minute', 0).set('second', 0).set('millisecond', 0),
        monday: model.monday || 'full',
        tuesday: model.tuesday || 'full',
        wednesday: model.wednesday || 'full',
        thursday: model.thursday || 'full',
        friday: model.friday || 'full',
        saturday: model.saturday || 'off',
        sunday: model.sunday || 'off',
        organization: model.organization
    }

    new db.shiftType(data)
        .save()
        .then(shiftType => {
            if (!shiftType) {
                return callback(new Error(`could not create the shiftType - ${model.code}`))
            }

            offline.queue('shiftType', 'create', {
                id: shiftType.id
            }, {
                organization: {
                    id: shiftType.organization.id
                }
            }, (err) => {
                callback(err, shiftType)
            })
        })
        .catch(callback)
}

exports.getDayStatus = (shiftType, date) => {
    let day = dates.day(date)

    if (shiftType[day] === 'off') {
        return Promise.cast('weekOff')
    }

    if (shiftType[day] === 'full') {
        return Promise.cast('working')
    }

    if (shiftType[day] === 'alternate') {
        // to be check recent old if that is off then working otherwise off
        let recentOldAlternateDay = moment().subtract(7, 'days')

        let fromDate = moment(recentOldAlternateDay) // for particular punchDate
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0)
            .set('millisecond', 0)._d

        let toDate = moment(fromDate).add(1, 'day')._d

        return db.shift.findOne({
            shiftType: shiftType._id,
            date: {
                $gte: fromDate,
                $lt: toDate
            }
        }).select('status').then(shift => {
            return (shift && shift.status === 'working') ? 'weekOff' : 'working'
        })
    }
}

exports.getByDate = async (date, employeeId, context) => {
    let employee = await db.employee.findOne({
        _id: employeeId
    }).populate('shiftType')

    let shiftType = employee.shiftType

    let effectiveShift = await db.effectiveShift.findOne({
        employee: employee.id,
        date: {
            $lte: dates.date(date).bod()
        }
    }).sort({ date: -1 }).populate('shiftType')

    if (effectiveShift) {
        shiftType = effectiveShift.shiftType
    }

    if (!shiftType) {
        shiftType = await get('gen', context)
    }

    return shiftType
}

exports.reset = async (employee, context) => {
    employee = await db.employee.findOne({
        _id: employee.id
    }).populate('shiftType')

    let effectiveShift = await db.effectiveShift.findOne({
        employee: employee.id,
        date: {
            $lte: dates.date().bod()
        }
    }).sort({ date: -1 }).populate('shiftType')

    let shiftType
    let changed = false
    if (effectiveShift && effectiveShift.shiftType) {
        shiftType = effectiveShift.shiftType
        if (!employee.shiftType) {
            context.logger.info(`set the shift of employee '${employee.code}' to '${shiftType.code}'`)
            employee.shiftType = shiftType
            changed = true
            await employee.save()
        } else if (employee.shiftType.id !== shiftType.id) {
            context.logger.info(`changing shift of employee '${employee.code}' from '${employee.shiftType.code}' to '${shiftType.code}'`)
            employee.shiftType = shiftType
            changed = true
            await employee.save()
        }
    }

    if (!shiftType) {
        shiftType = await get('gen', context)
        employee.shiftType = shiftType
        await employee.save()
    }
}

exports.getByCheckIn = async (time, context) => {
    let types = await db.shiftType.find({
        organization: context.organization
    })
    if (!types || !types.length) {
        return null
    }
    let type
    let startTimeGap

    types.forEach(item => {
        let startTime = moment(item.startTime)
        let userStartTime = moment(time)
            .set('hour', startTime.hour())
            .set('minute', startTime.minute())
            .set('second', startTime.second())
            .set('millisecond', 0)

        let gap = userStartTime < time ? time - userStartTime : userStartTime - time

        if ((!startTimeGap && startTimeGap !== 0) || gap < startTimeGap) {
            startTimeGap = gap
            type = item
        }
    })

    types.forEach(item => {
        let startTime = moment(item.startTime)
        let userStartTime = moment(time)
            .subtract(1, 'days')
            .set('hour', startTime.hour())
            .set('minute', startTime.minute())
            .set('second', startTime.second())
            .set('millisecond', 0)

        let gap = userStartTime < time ? time - userStartTime : userStartTime - time

        if ((!startTimeGap && startTimeGap !== 0) || gap < startTimeGap) {
            startTimeGap = gap
            type = item
        }
    })

    return type
}

exports.getByCheckOut = async (time, context) => {
    let types = await db.shiftType.find({
        organization: context.organization
    })
    if (!types || !types.length) {
        return null
    }
    let type
    let endTimeGap

    types.forEach(item => {
        let endTime = moment(item.endTime)
        let userEndTime = moment(time)
            .set('hour', endTime.hour())
            .set('minute', endTime.minute())
            .set('second', endTime.second())
            .set('millisecond', 0)

        let gap = userEndTime < time ? time - userEndTime : userEndTime - time

        if ((!endTimeGap && endTimeGap !== 0) || gap < endTimeGap) {
            endTimeGap = gap
            type = item
        }
    })
    return type
}
