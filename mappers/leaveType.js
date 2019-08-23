'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        unitsPerDay: entity.unitsPerDay,
        credit: entity.credit,
        unlimited: entity.unlimited,
        category: entity.category,
        carryForward: entity.carryForward,
        monthlyLimit: entity.monthlyLimit,
        periodicity: {
            type: 'manual',
            value: 0
        }
    }

    if (entity.credit && entity.unitsPerDay) {
        model.days = entity.credit / entity.unitsPerDay
    }

    if (entity.periodicity) {
        model.periodicity.type = entity.periodicity.type || 'manual'
        model.periodicity.value = entity.periodicity.value || 0
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
