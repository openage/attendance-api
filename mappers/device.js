'use strict'
let moment = require('moment')

exports.toModel = (entity, context) => {
    var model = {
        name: entity.name,
        bssid: entity.bssid,
        id: entity.id,
        ip: entity.ip,
        port: entity.port,
        mute: [],
        interval: entity.interval,
        type: entity.type,
        status: entity.status,
        lastSeen: entity.lastSeen
    }

    let fromNow = moment(new Date()).diff(entity.lastSeen, 'm')

    if (fromNow > 10 && entity.status === 'online') {
        model.status = 'not-available'
    }

    if (entity.mute && entity.mute.length) {
        entity.mute.forEach(item => {
            model.mute.push({
                start: item.start,
                end: item.end
            })
        })
    }
    if (!entity.machine && !entity.category) {
        return model
    }
    if (entity.category._doc) {
        model.category = {
            id: entity.category.id.toString(),
            name: entity.category.name
        }
    } else {
        model.category = entity.category.toString()
    }
    if (!entity.machine) {
        return model
    }
    if (entity.machine._doc) {
        model.machine = {
            id: entity.machine.id.toString(),
            model: entity.machine.model,
            manufacturer: entity.machine.manufacturer,
            picUrl: entity.machine.picUrl,
            picData: entity.machine.picData
        }
    } else {
        model.machine = entity.machine.toString()
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
