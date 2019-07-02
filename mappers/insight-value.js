'use strict'

exports.toModel = entity => {
    let model = {
        key: entity.key,
        label: entity.label,
        data: entity.data
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
