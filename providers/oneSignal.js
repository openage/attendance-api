'use strict'
const logger = require('@open-age/logger')('provider.oneSignal')
let Client = require('node-rest-client-promise').Client
let client = new Client()
var pushConfig = require('config').get('providers.oneSignal')
var _ = require('underscore')

// model = {subject, message, data}
exports.push = function (notification, toEmployee, config, context) {
    var deviceId
    if (!toEmployee) {
        logger.info(`no receiver found while sending notification`)
        return
    }

    if (!toEmployee._doc.device) {
        logger.info(`device Id not set of ${toEmployee.name}`)
        return
    }

    if (!toEmployee._doc.device.id) {
        logger.info(`device Id not set of ${toEmployee.name}`)
        return
    }

    deviceId = toEmployee._doc.device.id
    var args = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': pushConfig.authSecret
        },
        data: {
            'app_id': pushConfig.appId,
            'data': notification.data ? notification.data : {},
            'headings': {
                en: notification.subject
            },
            'contents': {
                en: notification.message
            },
            'include_player_ids': [],
            'android_group': notification.data && notification.data.api ? notification.data.api : ''
        }
    }

    if (typeof deviceId === Array) {
        _(deviceId).each(function (id) {
            args.data.include_player_ids.push(id)
        })
    } else {
        args.data.include_player_ids.push(deviceId)
    }

    if (pushConfig.testDeviceId) {
        args.data.include_player_ids.push(pushConfig.testDeviceId)
    }

    return new Promise((resolve, reject) => {
        client.post(pushConfig.url, args, function (data) {
            logger.info(data)
            return resolve(null)
        })
    })
}
