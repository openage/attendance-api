'use strict'
const logger = require('@open-age/logger')('channels.slack')
var db = global.db
var slackConfig = require('config').get('providers.slack')
var async = require('async')
var moment = require('moment')
var Slack = require('slack-node')
var _ = require('underscore')

let configGenerator = (config) => {
    if (!config) {
        return slackConfig
    }
    return {
        webhookUrl: config.webhookUrl || slackConfig.webhookUrl,
        channel: config.channel || slackConfig.channel,
        username: config.username || slackConfig.username,
        icon_emoji: config.icon_emoji || slackConfig.icon_emoji,
        token: config.token,
        domain: config.domain
    }
}

exports.chat = (message, toEmployee, config, context) => {
    var log = logger.start('sending slack message')

    let configuration = configGenerator(config)
    var slack = new Slack(configuration.token, configuration.token)
    slack.setWebhook(configuration.webhookUrl)

    return new Promise((resolve, reject) => {
        slack.webhook({
            channel: configuration.channel,
            username: configuration.username,
            icon_emoji: config.icon_emoji,
            text: message.message
        }, function (err, response) {
            if (err) {
                logger.error('err in slack provider')
                logger.error(err)
            }
            return resolve(null)
        })
    })
}
