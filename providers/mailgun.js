'use strict'
const logger = require('@open-age/logger')('providers.mailgun')
var mailgun = require('mailgun-js')
var defaultConfig = require('config').get('providers.mailgun')
var supportConfig = require('config').get('support')

let configGenerator = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        from: config.from || supportConfig,
        api_key: config.api_key || defaultConfig.api_key,
        domain: config.domain || defaultConfig.domain
    }
}

exports.email = (message, toEmployee, orgConfig, context) => {
    if (!toEmployee.email) {
        return Promise.resolve(null)
    }

    let log = logger.start('sending Mail')
    let config = configGenerator(orgConfig)

    let data = {
        to: toEmployee.email,
        subject: message.subject,
        html: message.body
    }

    if (typeof config.from === 'string') {
        data.from = config.from
    } else if (config.from.name) {
        data.from = `${config.from.name}<${config.from.email}>`
    } else {
        data.from = config.from.email
    }

    return new Promise((resolve, reject) => {
        (new mailgun({
            apiKey: config ? (config.api_key ? config.api_key : defaultConfig.api_key) : defaultConfig.api_key,
            domain: config ? (config.domain ? config.domain : defaultConfig.domain) : defaultConfig.domain
        })).messages().send(data, function (err, body) {
            if (err) {
                log.silly('Err: ' + err)
            }
            logger.info(body)
            return resolve(null)
        })
    })
}
