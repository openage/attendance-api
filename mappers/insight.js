'use strict'

const insightTypeMapper = require('./insight-type')

exports.toModel = (entity) => {
    let model = {
        title: entity.title,
        status: entity.status,
        config: entity.config
    }

    model.organization = {}

    if (entity.organization._doc) {
        model.organization = {
            id: entity.organization.id
        }
    } else {
        model.organization = {
            id: entity.organization
        }
    }

    model.employee = {}

    if (entity.employee._doc) {
        model.employee = {
            id: entity.employee.id
        }
    } else {
        model.employee = {
            id: entity.employee
        }
    }

    model.type = {}

    if (entity.type._doc) {
        model.type = insightTypeMapper.toModel(entity.type)
    } else {
        model.type = {
            id: entity.type
        }
    }

    return model
}
