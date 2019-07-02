'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    if (!entity.leaveType) {
        return
    }

    var model = {
        id: entity.id,
        date: entity.date,
        toDate: entity.toDate,
        isPlanned: entity.isPlanned,
        days: entity.days,
        status: entity.status,
        reason: entity.reason,
        comment: entity.comment,
        createdAt: entity.created_At
    }

    if (entity.start) {
        model.start = {
            first: entity.start.first,
            second: entity.start.second
        }
    }

    if (entity.end) {
        model.end = {
            first: entity.end.first,
            second: entity.end.second
        }
    }

    if (entity.leaveType && entity.leaveType._doc) {
        if (entity.leaveType.unlimited) {
            model.days = entity.units
        } else {
            model.days = entity.leaveType.unitsPerDay ? (Math.trunc((entity.units / entity.leaveType.unitsPerDay) * 10) / 10) : 0
        }

        model.leaveType = {
            id: entity.leaveType.id,
            name: entity.leaveType.name,
            code: entity.leaveType.code,
            category: entity.leaveType.category,
            unlimited: entity.leaveType.unlimited
        }
    }

    if (entity.employee && entity.employee._doc) {
        model.employee = {
            id: entity.employee.id,
            name: entity.employee.name,
            code: entity.employee.code,
            picData: entity.employee.picData,
            picUrl: entity.employee.picUrl === '' ? null : entity.employee.picUrl
        }
    } else if (entity.employee) {
        model.employee = {
            id: entity.employee.toString()
        }
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
