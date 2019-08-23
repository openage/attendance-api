'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        model: entity.model,
        manufacturer: entity.manufacturer,
        picUrl: entity.picUrl,
        picData: entity.picData
    }

    if (entity.category) {
        if (entity.category._doc) {
            model.category = {
                id: entity.category.id,
                name: entity.category.name
            }
        } else {
            model.category = {
                id: entity.category.toString()
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
