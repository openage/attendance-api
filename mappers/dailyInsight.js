'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        onHome: entity.status,
        date: entity.date,
        supervisor: entity.employee,
        statistics: entity.statistics
    }

    if (entity.alert) {
        const alert = {}
        alert.id = entity.alert.id
        alert.code = entity.alert.code
        alert.name = entity.alert.name
        alert.isDefault = entity.alert.isDefault
        alert.handlerName = entity.alert.handlerName
        alert.parameters = entity.alert.name
        alert.config = entity.alert.config
        model.alert = alert
    }

    if (entity.alert.alertType) {
        model.alertType = {
            id: entity.alert.alertType.id,
            name: entity.alert.alertType.name,
            code: entity.alert.alertType.code,
            description: entity.alert.alertType.description,
            picUrl: entity.alert.alertType.picUrl,
            cost: entity.alert.alertType.cost,
            default: entity.alert.alertType.default
        }

        model.alertType.processor = {
            parameters: []
        }

        if (entity.alert.alertType.processor && entity.alert.alertType.processor.comApp) { model.alertType.processor.comApp = entity.alert.alertType.processor.comApp }

        if (!_.isEmpty(entity.alert.alertType.processor.parameters)) {
            _.each(entity.alert.alertType.processor.parameters, item => {
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

        if (!_.isEmpty(entity.alert.alertType.trigger.parameters)) {
            _.each(entity.alert.alertType.trigger.parameters, item => {
                model.alertType.trigger.parameters.push({
                    id: item._id.toString(),
                    name: item.name,
                    value: entity.alert.config.trigger ? (entity.alert.config.trigger[item.name] ? entity.alert.config.trigger[item.name] : null) : null,
                    title: item.title,
                    type: item.type,
                    description: item.description,
                    expectedValues: item.expectedValues || []
                })
            })
        }
    } else {
        model.alertType = entity.alert.alertType.toString()
    }

    return model
}

exports.toEmployeeInsightModel = entity => {
    var model = {
        id: entity.id || entity._id.toString(),
        name: entity.name,
        code: entity.code,
        designation: entity.designation,
        picData: entity.picData,
        picUrl: entity.picUrl === '' ? null : entity.picUrl,
        email: entity.email,
        phone: entity.phone,
        tags: entity.tags,
        totalLeaveBalance: entity.totalLeaveBalance,
        userType: entity.userType || 'normal'
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}

exports.toEmployeeInsightList = entities => {
    return entities.map(entity => {
        return exports.toEmployeeInsightModel(entity)
    })
}
