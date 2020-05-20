'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        date: entity.date,
        name: entity.name,
        description: entity.description,
        departments: entity.departments,
        divisions: entity.divisions,
        status: entity.status
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
