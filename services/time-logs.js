'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')
const users = require('./employees')
const biometrics = require('./biometrics')

const moment = require('moment')
const dates = require('../helpers/dates')

const employeeService = require('./employee-getter')

const timeLogType = {
    checkIn: 'checkIn',
    checkOut: 'checkOut'
}

const sourceTypes = {
    system: 'system',
    biometric: 'biometricDevice',
    mobile: 'androidDevice', // 'iosDevice'
    admin: 'byAdmin',
    wifi: 'wifi',
    cctv: 'cctv'
}

exports.timeLogTypes = timeLogType
exports.sourceTypes = sourceTypes

exports.getByTime = (time, employee) => {
    return db.timeLog.findOne({
        time: time,
        employee: employee
    })
}

exports.remove = async (timeLog, context) => {
    await db.timeLog.deleteOne({ _id: timeLog.id })
}

exports.recent = (limit, callback) => {
    return db.timeLog.find({
        isUpdated: false
    })
        .select('_id')
        .limit(limit)
        .sort({ time: 1 })
        .exec(callback)
}
exports.resetTimeLogs = async (timeLogs, context) => {
    timeLogs = timeLogs || []

    let logger = context.logger.start('services/time-logs:resetTimeLogs')

    if (timeLogs.length > 1) {
        timeLogs = timeLogs.sort((a, b) => a.time - b.time)
    }
    timeLogs.forEach(log => {
        if (log.isComputed) {
            log.type = undefined
        }
    })

    let previousLog

    const threshold = context.getConfig('timeLog.ignore.threshold') // 2 minutes

    let updatedTimeLogs = []

    for (const log of timeLogs) {
        if (!log.ignore) {
            if (!previousLog) {
                previousLog = log
                if (!log.type) {
                    log.type = timeLogType.checkIn
                    await log.save()
                }
                updatedTimeLogs.push(log)
                continue
            }
            if (!log.type) {
                if (dates.time(log.time).diff(previousLog.time) < threshold) {
                    log.type = previousLog.type
                    log.ignore = true
                } else if (previousLog.type === timeLogType.checkIn) {
                    log.type = timeLogType.checkOut
                } else {
                    log.type = timeLogType.checkIn
                }
            } else if (dates.time(log.time).diff(previousLog.time) < threshold && log.type === previousLog.type) {
                log.ignore = true
            }
            await log.save()
            previousLog = log
        }

        updatedTimeLogs.push(log)
    }

    logger.end()

    return updatedTimeLogs
}

exports.getCheckInCheckOut = (timeLogs, context) => {
    let value = {
        checkIn: null,
        checkOut: null
    }
    if (!timeLogs || !timeLogs.length) {
        return value
    }
    let logs = timeLogs.filter(item => !item.ignore)
    if (!logs || !logs.length) {
        return value
    }
    let firstLog = logs[0]
    let lastLog = logs[logs.length - 1]

    if (firstLog.type === timeLogType.checkIn) {
        value.checkIn = firstLog.time
    }

    if (lastLog.type === timeLogType.checkOut) {
        value.checkOut = lastLog.time
    }

    return value
}

exports.getClockedMinutes = (timeLogs, context) => {
    context.logger.debug('services/time-logs:clockedMinutes')
    let timeSpan = 0 // minutes

    if (!timeLogs || !timeLogs.length) {
        return timeSpan
    }
    let logs = timeLogs.filter(item => !item.ignore)
    if (!logs || !logs.length) {
        return timeSpan
    }

    let checkIns = []
    let currentCheckIn

    logs.forEach(item => {
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

exports.getPasses = (attendance, context) => {
    let passes = []
    let pass1 = {
        out: null,
        in: null
    }
    let pass2 = {
        out: null,
        in: null
    }
    let pass3 = {
        out: null,
        in: null
    }
    let pass4 = {
        out: null,
        in: null
    }

    if (!attendance) {
        return passes
    }

    let timeLogs = attendance.timeLogs || []

    timeLogs = timeLogs.sort((a, b) => a.time - b.time).filter(log => !log.ignore)

    timeLogs.forEach(log => {
        if (log.type === timeLogType.checkIn) {
            let isCheckIn = attendance.checkIn && moment(attendance.checkIn).isSame(log.time, 'minutes')
            if (isCheckIn) {
                return
            }
            if (!pass1.in && !pass2.out) {
                pass1.in = log
            } else if (!pass2.in && !pass3.out) {
                pass2.in = log
            } else if (!pass3.in && !pass4.out) {
                pass3.in = log
            } else if (!pass4.in) {
                pass4.in = log
            }
        }

        if (log.type === timeLogType.checkOut) {
            let isCheckOut = attendance.checkOut && moment(attendance.checkOut).isSame(log.time, 'minutes')
            if (isCheckOut) {
                return
            }
            if (!pass1.out && !pass1.in) {
                pass1.out = log
            } else if (!pass2.out && !pass2.in) {
                pass2.out = log
            } else if (!pass3.out && !pass3.in) {
                pass3.out = log
            } else if (!pass4.out && !pass3.in) {
                pass4.out = log
            }
        }
    })

    if (pass1.in || pass1.out) { passes.push(pass1) }
    if (pass2.in || pass2.out) { passes.push(pass2) }
    if (pass3.in || pass3.out) { passes.push(pass3) }
    if (pass4.in || pass4.out) { passes.push(pass4) }

    return passes
}

exports.get = async (query, context) => {
    context.logger.debug('services/time-logs:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.timeLog.findById(query).populate('device').populate({
            path: 'employee',
            populate: { path: 'shiftType' }
        })
    }
    if (query.id) {
        return db.timeLog.findById(query.id).populate('device').populate({
            path: 'employee',
            populate: { path: 'shiftType' }
        })
    }

    if (query.time && query.employee) {
        return db.timeLog.findOne({
            time: query.time,
            employee: query.employee
        }).populate('device').populate({
            path: 'employee',
            populate: { path: 'shiftType' }
        })
    }

    return null
}

const getDeviceUser = async (code, device, context) => {
    let biometric = await biometrics.get({ code: code, device: device }, context)

    if (biometric) {
        return biometric.user
    }

    let user = await db.employee.findOne({
        biometricCode: code,
        status: {
            $in: ['temp', 'active']
        },
        organization: context.organization
    }).populate({ path: 'shiftType' }).populate('supervisor')

    if (!user) {
        user = await users.create({
            code: code,
            biometricCode: code,
            status: 'temp'
        }, context)
    }

    await biometrics.create({
        device: device,
        user: user,
        code: code
    }, context)

    return user
}
exports.create = async (model, context) => {
    let log = context.logger.start('services/time-logs:create')

    let device

    if (model.device) {
        device = await db.device.findById(model.device.id)
    }

    let user

    log.debug(model)
    if (model.employee.id) {
        user = model.employee
    } else if (model.employee.code) {
        user = await users.getByCode(model.employee.code, context)
        if (!user) {
            throw new Error(`employee with code '${model.employee.code}' not found`)
        }
    } else if (model.employee.biometricCode && device) {
        user = await getDeviceUser(model.employee.biometricCode, device, context)
    }

    let attendanceId

    if (model.attendance) {
        attendanceId = model.attendance.id
    }

    let timeLog = await db.timeLog.findOne({
        time: model.time,
        employee: user.id
    })

    if (timeLog) {
        log.debug(`entry (id:'${timeLog.id}) exists for employee: '${user.code}' with time: '${model.time}' - reprocessing `)
        // return timeLog
    } else {
        timeLog = new db.timeLog({
            type: model.type,
            isComputed: !model.type,
            device: device,
            employee: user.id,
            attendanceId: attendanceId,
            time: model.time,
            ipAddress: model.ipAddress,
            source: model.source,
            location: model.location,
            isUpdated: context.online,
            organization: context.organization,
            tenant: context.tenant
        })
        await timeLog.save()
        log.debug(`new entry created with id: ${timeLog.id}`)
    }

    timeLog = await exports.get(timeLog.id, context)

    await offline.queue('timeLog', 'create', timeLog, context)

    return timeLog
}

exports.update = async (id, model, context) => {
    let timeLog = await exports.get(id, context)
    if (!timeLog) {
        throw new Error(`could not find the timeLog with id '${id}'`)
    }
    if (model.type) {
        timeLog.type = model.type
        timeLog.isComputed = false
    }

    if (model.ignore !== undefined) {
        timeLog.ignore = model.ignore
    }

    await timeLog.save()
    await offline.queue('timeLog', 'update', timeLog, context)
    return timeLog
}

exports.search = async (param, paging, context) => {
    context.logger.start('search')
    let query = {
        organization: context.organization,
        employee: context.user
    }

    if (param.employeeId || param.user) {
        query.employee = await employeeService.get(param.employeeId || param.user, context)
    }

    if (param.attendanceId || param.attendance) {
        query.attendanceId = param.attendanceId || param.attendance.id
    } else {
        query.time = {
            $gte: dates.date(param.fromDate).bod(),
            $lt: dates.date(param.fromDate).eod()
        }
    }

    const count = await db.timeLog.find(query).count()

    var items = []

    if (paging) {
        items = await db.timeLog.find(query).skip(paging.skip).limit(paging.limit)
    } else {
        items = await db.timeLog.find(query)
    }

    return {
        count: count,
        items: items
    }
}
