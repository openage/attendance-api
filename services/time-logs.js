'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')
const employees = require('./employees')

const timeLogType = {
    checkIn: 'checkIn',
    checkOut: 'checkOut'
}

exports.getByTime = (time, employee) => {
    return db.timeLog.findOne({
        time: time,
        employee: employee
    })
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
    let log = context.logger.start('services/time-logs:resetTimeLogs')
    timeLogs = timeLogs || []

    if (timeLogs.length !== 0) {
        timeLogs = timeLogs.sort((a, b) => a.time - b.time)
    }
    timeLogs.forEach(log => {
        if (log.source === 'biometricDevice' || log.isComputed) {
            log.type = null
        }
    })

    let previousLog

    const threshold = 120000

    for (const log of timeLogs) {
        if (!previousLog) {
            previousLog = log
            if (!previousLog.type) {
                previousLog.type = timeLogType.checkIn
                await previousLog.save()
            }
            continue
        }

        if (!log.type) {
            if (log.time.getTime() - previousLog.time.getTime() < threshold) {
                log.type = previousLog.type
            } else if (previousLog.type === timeLogType.checkIn) {
                log.type = timeLogType.checkOut
            } else {
                log.type = timeLogType.checkIn
            }
            await log.save()
        }
        previousLog = log
    }

    log.end()

    return timeLogs
}
exports.create = async (model, context) => {
    let log = context.logger.start('services/time-logs:create')
    let employee

    if (model.employee.id) {
        employee = model.employee
    } else {
        employee = await employees.getByCode(model.employee.code, context)
        if (!employee) {
            throw new Error(`employee with code '${model.employee.code}' not found`)
        }
    }

    let device

    if (model.device) {
        device = await db.device.findById(model.device.id)
    }

    let timeLog = await db.timeLog.findOne({
        time: model.time,
        employee: employee.id
    })

    if (timeLog) {
        log.info(`entry (id:'${timeLog.id}) exists for employee: '${employee.code}' with time: '${model.time}' - reprocessing `)
        // return timeLog
    } else {
        timeLog = new db.timeLog({
            type: model.type,
            isComputed: !model.type,
            device: device,
            employee: employee.id,
            time: model.time,
            ipAddress: model.ipAddress,
            source: model.source,
            location: model.location,
            isUpdated: context.online
        })
        await timeLog.save()
        log.debug(`new entry created with id: ${timeLog.id}`)
    }

    await offline.queue('timeLog', 'create', { id: timeLog.id }, context)

    return timeLog
}

exports.update = (id, model, context) => {
    return db.timeLog.findById(id).then(timeLog => {
        if (!timeLog) {
            throw new Error(`could not find the timeLog with id '${id}'`)
        }
        if (model.type) {
            timeLog.type = model.type
        }

        return timeLog.save().then(() => {
            return offline.queue('timeLog', 'update', { id: timeLog.id }, context)
                .then(() => timeLog)
        })
    })
}
