const moment = require('moment')
exports.toModel = (entity) => {
    const model = {
        id: entity.id,
        code: entity.code,
        marks: entity.marks,
        status: entity.status
    }

    if (entity.user && entity.user._doc) {
        model.user = {
            id: entity.user.id
        }
    } else {
        model.user = {
            id: entity.user
        }
    }

    if (entity.device && entity.device._doc) {
        model.device = {
            id: entity.device.id,
            name: entity.device.name,
            type: entity.device.type,
            status: entity.device.status
        }

        let fromNow = moment(new Date()).diff(entity.device.lastSeen, 'm')

        if (fromNow > 10 && entity.device.status === 'online') {
            model.device.status = 'not-available'
        }
    } else {
        model.device = {
            id: entity.device
        }
    }
    return model
}
