'use strict'

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        unitsPerDay: entity.unitsPerDay,
        unlimited: entity.unlimited,
        category: entity.category,
        periodicity: entity.periodicity,
        carryForward: entity.carryForward,
        monthlyLimit: entity.monthlyLimit
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
