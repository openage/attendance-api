'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        date: entity.date,
        employee: !entity.employee._id ? entity.employee : entity.employee._id,
        alert: entity.alert,
        requestedAt: entity.requestedAt,
        startedAt: entity.startedAt,
        completedAt: entity.completedAt,
        filePath: entity.fullPath,
        fileUrl: entity.fileUrl,
        error: entity.error,
        params: entity.params,
        status: entity.status
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
