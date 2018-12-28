'use strict'
const logger = require('@open-age/logger')('services.devices')
const db = require('../models')

exports.log = (deviceId, level, message, context) => {
    if (!deviceId) {
        return Promise.cast('')
    }
    let id = deviceId.id || deviceId

    return db.device.findById(id).then(device => {
        if (!device) {
            logger.error(`could not log ${level} message ${message}, reason: device with id: ${deviceId} not found`)
            return Promise.cast('')
        }
        return new db.deviceLog({
            status: level,
            description: message,
            device: device
        }).save()
    }).catch(err => {
        logger.error(`could not log ${level} message ${message} to device ${deviceId}`, err)
        return Promise.cast('')
    })
}
