'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name,
        category: entity.category,
        description: entity.description,
        picUrl: entity.picUrl || ''
    }

    model.channel = {}
    if (!_.isEmpty(entity.channel)) {
        model.channel = {
            id: entity.channel.id,
            type: entity.channel.type.toString(),
            organization: entity.channel.organization.toString(),
            status: entity.channel.status,
            config: entity.channel.config
        }
    }

    model.parameters = []

    if (!_.isEmpty(entity.parameters)) {
        _.each(entity.parameters, item => {
            var data = {
                id: item._id.toString(),
                name: item.name,
                title: item.title,
                type: item.type,
                description: item.description,
                expectedValues: item.expectedValues,
                value: null
            }

            if (!_.isEmpty(entity.channel) && model.channel.config[item.name]) {
                data.value = model.channel.config[item.name]
            }

            model.parameters.push(data)
        })
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
