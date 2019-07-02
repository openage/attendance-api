'use strict'

exports.toModel = (entity) => {
    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        default: entity.default,
        cost: entity.cost
    }

    if (entity.pic) {
        model.pic = {
            url: entity.pic.url,
            thumbnail: entity.pic.url
        }
    }

    if (entity.trigger) {
        model.trigger = {
            entity: entity.trigger.entity,
            action: entity.trigger.action,
            parameters: entity.trigger.parameters
        }
    }

    if (entity.processor) {
        model.processor = {
            name: entity.processor.name,
            summaryCalculator: entity.processor.summaryCalculator,
            category: entity.processor.category,
            parameters: entity.trigger.parameters
        }
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
