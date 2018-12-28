'use strict'
var defaultConfig = require('config').get('providers.routeSms')
var Client = require('node-rest-client').Client
var client = new Client()
const logger = require('@open-age/logger')('providers.routeSms')

let configGenerator = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        url: config.url || defaultConfig.url,
        userName: config.userName || defaultConfig.userName,
        password: config.password || defaultConfig.password,
        type: config.type || defaultConfig.type,
        dlr: config.dlr || defaultConfig.dlr,
        source: config.source || defaultConfig.source
    }
}

exports.sms = function (message, toEmployee, config, context) {
    var log = logger.start('sending sms from sms-route')

    if (!toEmployee.phone) {
        logger.debug(`no phone number found in ${toEmployee.name}`)
        return
    }

    log.info({
        phone: toEmployee.phone,
        name: toEmployee.name,
        message: message.message
    })

    let configuration = configGenerator(config)

    let url = `${configuration.url}/bulksms/bulksms?username=${configuration.userName}&password=${defaultConfig.password}&type=${configuration.type}&dlr=${configuration.dlr}&destination=${toEmployee.phone}&source=${configuration.source}&message=${message.message}`

    return new Promise((resolve, reject) => {
        client.get(url, function (err, data) {
            if (err) {
                log.silly('Err: ' + err)
            }
            logger.info(data)
            return resolve(null)
        })
    })
}
