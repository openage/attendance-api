'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        date: entity.date
    }

    if (entity.shiftType) {
        if (entity.shiftType._doc) {
            model.shiftType = {
                id: entity.shiftType.id,
                name: entity.shiftType.name,
                code: entity.shiftType.code,
                startTime: entity.shiftType.startTime,
                endTime: entity.shiftType.endTime
            }
        } else {
            model.shiftType = {
                id: entity.shiftType.toString()
            }
        }
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}