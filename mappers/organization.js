'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        activationKey: entity.activationKey,
        timeStamp: entity.timeStamp
    }

    return model
}
