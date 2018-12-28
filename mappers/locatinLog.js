'use strict'

exports.toModel = entity => {
    var model = {
        ipAddress: entity.ipAddress,
        time: entity.time,
        location: entity.location,
        attendance: entity.attendance,
        employee: entity.employee,
        message: entity.message
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
