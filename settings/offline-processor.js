'use strict'

const queueConfig = require('config').get('queueServer')

const fromService = (name) => {
    let service = require(`../services/${name}`)
    return {
        serializer: async (entity) => {
            return { id: entity.id }
        },
        deserializer: async (model, context) => {
            return service.get(model, context)
        }
    }
}

exports.configure = function (logger) {
    let log = logger.start('settings/offline-processors:configure')
    let config = JSON.parse(JSON.stringify(queueConfig))
    config.context = require('../helpers/context-builder')
    config.models = {
        reportRequest: fromService('reportRequests')
    }
    require('@open-age/offline-processor').initialize(config, log)
}
