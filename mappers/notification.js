'use strict'
var _ = require('underscore')

var mapper = exports

mapper.toModel = function (obj) {
    var model = {
        id: obj._id.toString(),
        date: obj.date,
        priority: obj.priority,
        subject: obj.subject,
        message: obj.message,
        status: obj.status,
        data: {
            entity: {
                id: obj.data.entity.id,
                picData: obj.data.entity.picData,
                picUrl: obj.data.entity.picUrl || '',
                type: obj.data.entity.type,
                name: obj.data.entity.name,
                phone: obj.data.entity.phone
            },
            api: obj.data.api,
            action: obj.data.action
        }
    }
    model.task = {}

    if (!_.isEmpty(obj.task)) {
        model.task = {
            type: obj.task.type,
            id: obj.task.id,
            actions: obj.task.actions
        }
    }

    return model
}

mapper.toSearchModel = function (entities) {
    return _(entities).map(mapper.toModel)
}
