'use strict'

exports.toModel = (entity, context) => {
    const model = {
        id: entity.id,
        entity: entity.entity,
        action: entity.action,
        date: entity.date,
        progress: entity.progress,
        data: entity.data,
        meta: entity.meta,
        error: entity.error,
        assignedTo: entity.assignedTo,
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

exports.toSearchModel = (entities, context) => {
    return entities.map((entity) => {
        return exports.toSearchModel(entities, context)
    })
}
