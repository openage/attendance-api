'use strict'
var defaultConfig = require('config').get('providers.atoms')
var supportConfig = require('config').get('support')
const logger = require('@open-age/logger')('providers.atoms')
var async = require('async')
var Client = require('node-rest-client').Client
var moment = require('moment')
var client = new Client()

let configGenerator = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        token: config.token || defaultConfig.token,
        from: config.from || supportConfig.email,
        url: config.url || defaultConfig.url
    }
}

exports.process = function (data, templateCode, sendTo, cb) {
    var log = logger.start('sending sms')

    log.debug('data', data)
    let config = configGenerator(null) // TODO get orgConfig

    var args = {
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': config.token
        },
        data: {
            'template': {
                'code': templateCode
            },
            'to': sendTo,
            'from': config.from,
            'data': data
        }
    }

    client.post(config.url + '/sms/send', args, function (data, response) {
        log.debug('admin issue sms response', data)
        if (cb) {
            cb()
        }
    })
}
