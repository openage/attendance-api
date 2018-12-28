'use strict'

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name
    }
    if (entity.tagType) {
        model.tagType = {}
        model.tagType.id = global.toObjectId(entity.tagType.id)
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
