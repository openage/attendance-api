'use strict'

exports.toModel = (entity, context) => {
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
                endTime: entity.shiftType.endTime,
                breakTime: entity.shiftType.breakTime,
                color: entity.shiftType.color || '#000000',
                isDynamic: entity.shiftType.isDynamic
            }
        } else {
            model.shiftType = {
                id: entity.shiftType.toString()
            }
        }
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
