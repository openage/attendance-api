let _ = require('underscore')

exports.toModel = entity => {
    let model = {
        id: entity._id.toString(),
        name: entity.name,
        tags: []
    }
    if (entity.tags) {
        _.each(entity.tags, tag => {
            model.tags.push({
                id: tag._id.toString(),
                name: tag.name.toLowerCase()
            })
        })
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
