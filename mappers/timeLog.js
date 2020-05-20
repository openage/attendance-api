'use strict'

const moment = require('moment')

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }
    if (entity.device) {
        var ip = entity.device.ip
    }
    var model = {
        id: entity.id,
        type: entity.type,
        time: entity.time,
        ipAddress: entity.ipAddress || ip,
        source: entity.source,
        isComputed: !!entity.isComputed,
        ignore: !!entity.ignore,
        location: entity.location
    }

    if (entity.attendance) {
        model.attendance = {
            status: entity.attendance.status,
            checkIn: entity.attendance.checkIn,
            checkOut: entity.attendance.checkOut,
            hoursWorked: entity.attendance.hoursWorked,
            minsWorked: entity.attendance.minsWorked
        }
    }

    if (entity.device) {
        if (entity.device._doc) {
            model.device = {
                id: entity.device.id,
                name: entity.device.name,
                type: entity.device.type
            }
        } else {
            model.device = {
                id: entity.device.toString()
            }
        }
    }

    if (entity.employee) {
        if (entity.employee._doc) {
            model.employee = {
                id: entity.employee.id,
                name: entity.employee.name,
                code: entity.employee.type
            }
        } else {
            model.employee = {
                id: entity.employee.toString()
            }
        }
    }
    if (entity.decision && context && context.req && context.req.columns && context.req.columns.explain) {
        const explainFormat = (item) => {
            let explain = {
                checkInLimit: moment(item.checkInLimit).format('HH:mm DD-MM-YYYY'),
                startTime: moment(item.startTime).format('HH:mm DD-MM-YYYY'),
                endTime: moment(item.endTime).format('HH:mm DD-MM-YYYY'),
                checkoutLimitA: moment(item.checkoutLimitA).format('HH:mm DD-MM-YYYY'),
                checkoutLimit: moment(item.checkoutLimit).format('HH:mm DD-MM-YYYY'),
                value: 0,
                reason: 'not set'
            }

            return explain
        }
        model.explain = {
            time: moment(entity.time).format('HH:mm DD-MM-YYYY'),
            previous: entity.decision.previousMatch ? explainFormat(entity.decision.previousMatch) : {},
            latest: entity.decision.latestMatch ? explainFormat(entity.decision.latestMatch) : {}
        }
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
