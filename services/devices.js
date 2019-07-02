'use strict'
const db = require('../models')

exports.log = async (deviceId, level, message, context) => {
    if (!deviceId) {
        return
    }
    let id = deviceId.id || deviceId

    try {
        const device = await db.device.findById(id)
        if (!device) {
            context.logger.error(`could not log ${level} message ${message}, reason: device with id: ${deviceId} not found`)
            return
        }
        return new db.deviceLog({
            status: level,
            description: message,
            device: device
        }).save()
    } catch (err) {
        context.logger.error(`could not log ${level} message ${message} to device ${deviceId}`, err)
    }
}

exports.setOnline = async (device, context) => {
    let id = device.id || device

    let log = context.logger.start({ location: 'setOnline', device: id })

    device = await db.device.findById(id)

    if (device.status === 'disabled') {
        let error = 'DEVICE_DISABLED'
        log.error(error)
        throw new Error(error)
    }
    if (device.status === 'offline') {
        log.info('device is now back')
    }
    device.status = 'online'
    device.lastSeen = new Date()
    return device.save()
}

exports.setOffline = async (device, context) => {
    let id = device.id || device

    let log = context.logger.start({ location: 'setOnline', device: id })

    device = await db.device.findById(id)

    if (device.status === 'disabled') {
        let error = 'DEVICE_DISABLED'
        log.error(error)
        throw new Error(error)
    }

    if (device.status === 'online') {
        log.error('DEVICE_OFFLINE')
    }

    device.status = 'offline'
    return device.save()
}
