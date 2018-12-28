'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        type: entity.type.toString(),
        organization: entity.organization.id || entity.organization.id.toString() || entity.organization.toString(),
        status: entity.status,
        config: entity.config
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
