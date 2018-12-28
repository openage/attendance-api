'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        model: entity.model,
        manufacturer: entity.manufacturer,
        picUrl: entity.picUrl,
        picData: entity.picData,
        category: entity.category
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
