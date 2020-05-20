'use strict'
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const dates = require('../helpers/dates')
const db = require('../models')

const get = async (query, context) => {
    if (query._doc) {
        return query
    }
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
        if (typeof query.id === 'string') {
            return db.shiftType.findById(query.id)
        } else {
            return db.shiftType.findById(query.toString())
        }
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

exports.getGrace = (shiftType, context) => {
    let grace = {
        checkIn: {
            early: 0,
            late: 0
        },
        checkOut: {
            early: 0,
            late: 0
        }
    }

    if (shiftType.grace) {
        if (shiftType.grace.checkIn) {
            grace.checkIn.early = shiftType.grace.checkIn.early
            grace.checkIn.late = shiftType.grace.checkIn.late
        }

        if (shiftType.grace.checkOut) {
            grace.checkOut.early = shiftType.grace.checkOut.early
            grace.checkOut.late = shiftType.grace.checkOut.late
        }
    }

    return grace
}

const setGrace = (shiftType, graceModel, context) => {
    shiftType.grace = {
        checkIn: {
            early: graceModel.checkIn.early || 0,
            late: graceModel.checkIn.late || 0
        },
        checkOut: {
            early: graceModel.checkOut.early || 0,
            late: graceModel.checkOut.late || 0
        }
    }

    return shiftType
}

const set = async (shiftType, model, context) => {
    if (model.name) {
        shiftType.name = model.name
    }

    if (model.grace) {
        shiftType = setGrace(shiftType, model.grace)
    }
    if (model.breakTime !== undefined) {
        shiftType.breakTime = model.breakTime
    }
    if (model.color) {
        shiftType.color = model.color
    }
    if (model.isDynamic !== undefined) {
        shiftType.isDynamic = model.isDynamic
    }
    if (model.department !== undefined) {
        if (model.department === '' || model.department === null) {
            shiftType.department = undefined
        } else {
            shiftType.department = model.department
        }
    }

    if (model.autoExtend !== undefined) {
        shiftType.autoExtend = model.autoExtend
    }

    if (model.startTime) {
        shiftType.startTime = moment(model.startTime).set('seconds', 0).set('milliseconds', 0)
    }
    if (model.endTime) {
        shiftType.endTime = moment(model.endTime).set('seconds', 0).set('milliseconds', 0)
    }

    if (model.monday) {
        shiftType.monday = model.monday
    }
    if (model.tuesday) {
        shiftType.tuesday = model.tuesday
    }
    if (model.wednesday) {
        shiftType.wednesday = model.wednesday
    }
    if (model.thursday) {
        shiftType.thursday = model.thursday
    }
    if (model.friday) {
        shiftType.friday = model.friday
    }
    if (model.saturday) {
        shiftType.saturday = model.saturday
    }
    if (model.sunday) {
        shiftType.sunday = model.sunday
    }

    return shiftType
}

exports.create = async (model, context) => {
    model.code = model.code.toLowerCase()
    let entity = await db.shiftType.findOne({
        code: model.code,
        organization: context.organization.id
    })

    if (entity) {
        throw new Error(`code '${model.code}' already exists`)
    }

    let shiftType = new db.shiftType({
        code: model.code,
        organization: context.organization
    })

    shiftType = await set(shiftType, {
        grace: model.grace || {
            checkIn: {
                early: 0,
                late: 0
            },
            checkOut: {
                early: 0,
                late: 0
            }
        },
        name: model.name,
        breakTime: model.breakTime || 0,
        color: model.color,
        isDynamic: model.isDynamic,
        department: model.department,
        startTime: model.startTime || moment().set('hour', 9).set('minute', 0).set('second', 0).set('millisecond', 0),
        endTime: model.endTime || moment().set('hour', 18).set('minute', 0).set('second', 0).set('millisecond', 0),
        monday: model.monday || 'full',
        tuesday: model.tuesday || 'full',
        wednesday: model.wednesday || 'full',
        thursday: model.thursday || 'full',
        friday: model.friday || 'full',
        saturday: model.saturday || 'off',
        sunday: model.sunday || 'off'
    }, context)

    shiftType = await shiftType.save()

    await offline.queue('shift-type', 'create', shiftType, context)

    return shiftType
}

exports.update = async (id, model, context) => {
    let shiftType = await db.shiftType.findById(id)

    if (model.code && shiftType.code.toLowerCase() !== model.code.toLowerCase()) {
        model.code = model.code.toLowerCase()
        let entity = await db.shiftType.findOne({
            code: model.code,
            organization: context.organization.id
        })

        if (entity) {
            throw new Error(`code '${model.code}' already exists`)
        }

        shiftType.code = model.code
    }

    shiftType = await set(shiftType, model, context)

    await shiftType.save()
    await offline.queue('shift-type', 'update', shiftType, context)

    return shiftType
}

const getTimings = (shiftType, ofDate, context) => {
    let date = dates.date(ofDate)

    let startTime = date.setTime(shiftType.startTime)

    let endTime = date.setTime(shiftType.endTime)

    if (endTime < startTime) {
        endTime = dates.date(date.nextBod()).setTime(shiftType.endTime)
    }

    return {
        startTime: startTime,
        endTime: endTime
    }
}

exports.getTimings = getTimings

exports.getOverTime = (shiftType, count, options, context) => {
    const extraShifts = count - 1

    if (extraShifts <= 0) {
        return 0
    }

    let time = getTimings(shiftType, new Date(), context)

    let minutes = dates.time(time.startTime).diff(time.endTime) / 60

    return extraShifts * minutes
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
    }).sort({
        date: -1
    }).populate('shiftType')

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
    }).sort({
        date: -1
    }).populate('shiftType')

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

exports.getByEmployee = async (employee, context) => {
    let where = {
        $or: [{
            organization: context.organization.id,
            department: employee.department,
            status: {
                $ne: 'inactive'
            }
        }, {
            organization: context.organization.id,
            department: null,
            status: {
                $ne: 'inactive'
            }
        }]
    }

    if (employee.isDynamicShift) {
        where.$or.forEach(item => {
            item.isDynamic = true
        })
    }
    return db.shiftType.find(where)
}

exports.getByCheckIn = async (time, employee, context) => {
    let types = await exports.getByEmployee(employee, context)

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

exports.getByCheckOut = async (time, employee, context) => {
    let types = await exports.getByEmployee(employee, context)
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

const search = async (query, context) => {
    let log = context.logger.start('services/ShiftType:search')

    let employee
    let where = {}
    if (query.employeeId) {
        employee = await db.employee.findOne({
            _id: query.employeeId
        })
    }
    if (query.isDynamicShift === true) {
        where.isDynamic = true
    }
    if (employee) {
        where.$or = [{
            organization: context.organization.id.toObjectId(),
            department: employee.department,
            status: {
                $ne: 'inactive'
            }
        }, {
            organization: context.organization.id.toObjectId(),
            department: null,
            status: {
                $ne: 'inactive'
            }
        }]
    } else if (query.department === 'shared') {
        where = {
            organization: context.organization.id.toObjectId(),
            department: null,
            status: {
                $ne: 'inactive'
            }
        }
    } else if (query.department) {
        where.$or = [{
            organization: context.organization.id.toObjectId(),
            department: query.department,
            status: {
                $ne: 'inactive'
            }
        }, {
            organization: context.organization.id.toObjectId(),
            department: null,
            status: {
                $ne: 'inactive'
            }
        }]
    } else {
        where = {
            organization: context.organization.id.toObjectId(),
            status: {
                $ne: 'inactive'
            }
        }
    }
    if (query.id) {
        where['_id'] = global.toObjectId(query.id)
    }

    let shiftTypes = await db.shiftType.find(where)

    if (shiftTypes.length > 1) {
        shiftTypes.sort((x, y) => {
            return new Date(x.startTime.getHours()) - new Date(y.startTime.getHours())
        })
    }
    log.end()
    return shiftTypes
}
exports.search = search
