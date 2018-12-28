'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        unitsPerDay: entity.unitsPerDay,
        startTime: entity.startTime,
        endTime: entity.endTime,
        monday: entity.monday,
        tuesday: entity.tuesday,
        wednesday: entity.wednesday,
        thursday: entity.thursday,
        friday: entity.friday,
        saturday: entity.saturday,
        sunday: entity.sunday,
        status: entity.status
    }

    // if (entity.organization) {
    //     if (entity.organization._doc) {
    //         model.organization = {
    //             id: entity.organization.id,
    //             name: entity.organization.name,
    //             code: entity.organization.code
    //         };
    //     } else {
    //         model.organization = {
    //             id: entity.organization.toString()
    //         };
    //     }
    // }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
