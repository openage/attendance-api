'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id || entity._id,
        status: entity.status
    }

    if (entity.organization) {
        if (entity.organization._doc) {
            model.organization = {
                id: entity.organization.id,
                name: entity.organization.name,
                code: entity.organization.code
            }
        } else {
            model.organization = {
                id: entity.organization.toString()
            }
        }
    }

    if (entity.alertType._doc || entity.alertType) {
        model.alertType = {
            id: entity.alertType.id,
            name: entity.alertType.name,
            code: entity.alertType.code,
            description: entity.alertType.description,
            picUrl: entity.alertType.picUrl,
            cost: entity.alertType.cost,
            hasInsights: entity.alertType.hasInsights,
            hasNotifications: entity.alertType.hasNotifications,
            hasReports: entity.alertType.hasReports,
            default: entity.alertType.default
        }

        model.alertType.processor = {
            parameters: []
        }

        if (entity.alertType.processor && entity.alertType.processor.comApp) { model.alertType.processor.comApp = entity.alertType.processor.comApp }

        if (!_.isEmpty(entity.alertType.processor.parameters)) {
            _.each(entity.alertType.processor.parameters, item => {
                model.alertType.processor.parameters.push({
                    id: item._id.toString(),
                    name: item.name,
                    title: item.title,
                    type: item.type,
                    description: item.description
                })
            })
        }

        model.alertType.trigger = {
            parameters: []
        }

        if (!_.isEmpty(entity.alertType.trigger.parameters)) {
            _.each(entity.alertType.trigger.parameters, item => {
                model.alertType.trigger.parameters.push({
                    id: item._id.toString(),
                    name: item.name,
                    value: entity.config.trigger ? (entity.config.trigger[item.name] ? entity.config.trigger[item.name] : null) : null,
                    title: item.title,
                    type: item.type,
                    description: item.description,
                    expectedValues: item.expectedValues || []
                })
            })
        }
    } else {
        model.alertType = entity.alertType.toString()
    }

    model.config = {}
    if (!_.isEmpty(entity.config)) {
        model.config = entity.config
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
