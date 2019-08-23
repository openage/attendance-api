'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        date: entity.date,
        name: entity.name
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
