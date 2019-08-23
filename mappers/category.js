'use strict'
exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        name: entity.name
    }

    model.machines = []

    if (entity.machines && entity.machines.length) {
        entity.machines.forEach(machine => {
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

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
