'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        description: entity.description,
        picUrl: entity.picUrl,
        cost: entity.cost,
        default: entity.default,
        hasInsights: entity.hasInsights,
        hasNotifications: entity.hasNotifications,
        hasReports: entity.hasReports
    }

    // model.channels = [];
    // if (!_.isEmpty(entity.channels)) {
    //     _.each(entity.channels, channel => {
    //         model.channels.push({
    //             id: channel.id,
    //             name: channel.name,
    //             providerName: channel.providerName,
    //             description: channel.description
    //         });
    //     });
    // }

    model.processor = {
        parameters: []
    }
    if (entity.processor && entity.processor.comApp) { model.processor.comApp = entity.processor.comApp }

    if (!_.isEmpty(entity.processor.parameters)) {
        _.each(entity.processor.parameters, item => {
            model.processor.parameters.push({
                id: item._id.toString(),
                name: item.name,
                title: item.title,
                type: item.type,
                description: item.description
            })
        })
    }

    model.trigger = {
        parameters: []
    }

    if (!_.isEmpty(entity.trigger.parameters)) {
        _.each(entity.trigger.parameters, item => {
            model.trigger.parameters.push({
                id: item._id.toString(),
                name: item.name,
                title: item.title,
                type: item.type,
                description: item.description,
                expectedValues: item.expectedValues || []
            })
        })
    }

    if (entity.alert) {
        model.alert = {
            status: entity.alert.status
        }
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
