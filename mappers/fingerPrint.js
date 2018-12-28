'use strict'

exports.toModel = (entity) => {
    const model = {
        id: entity.id,
        marks: entity.marks,
        status: entity.status
    }

    if (entity.employee && entity.employee._doc) {
        model.employee = {
            id: entity.employee.id
        }
    } else {
        model.employee = {
            id: entity.employee
        }
    }
    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
