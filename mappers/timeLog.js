'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    if (entity.device) {
        var ip = entity.device.ip
    }
    var model = {
        id: entity.id,
        type: entity.type,
        device: entity.device,
        employee: entity.employee,
        time: entity.time,
        ipAddress: entity.ipAddress || ip,
        source: entity.source,
        location: entity.location
    }

    if (entity.attendance) {
        model.attendance = {
            status: entity.attendance.status,
            checkIn: entity.attendance.checkIn,
            checkOut: entity.attendance.checkOut,
            hoursWorked: entity.attendance.hoursWorked,
            minsWorked: entity.attendance.minsWorked
        }
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
