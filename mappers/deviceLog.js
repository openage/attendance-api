'use strict'

exports.toModel = (entity, context) => {
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

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
