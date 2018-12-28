'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name
    }

    model.machines = []

    if (!_.isEmpty(entity.machines)) {
        _.each(entity.machines, machine => {
            model.machines.push({
                id: machine.id.toString(),
                model: machine.model,
                manufacturer: machine.manufacturer,
                picUrl: machine.picUrl,
                picData: machine.picData,
                port: machine.port
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
