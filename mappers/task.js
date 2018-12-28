'use strict'

exports.toModel = (entity) => {
    const model = {
        id: entity.id,
        action: entity.action,
        date: entity.date,
        status: entity.status,
        employee: entity.employee,
        device: {}
    }
    if (entity.device && entity.device._doc) {
        model.device = {
            id: entity.device.id
        }
    } else {
        model.device = {
            id: entity.device
        }
    }

    if (entity.organization && entity.organization._doc) {
        model.organization = {
            id: entity.organization.id
        }
    } else {
        model.organization = {
            id: entity.organization
        }
    }
    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
