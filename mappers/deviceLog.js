'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        deviceId: entity.device ? entity.device.toString() : ' ',
        status: entity.status,
        message: entity.description,
        date: entity.created_At,
        deviceName: entity.device ? entity.device.machine.manufacturer : ' ',
        ipAddress: entity.device ? entity.device.ip : ' ',
        location: '' // TODO
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
