'use strict'
const mailer = require('config').get('mailer')
const providerConfigs = require('config').get('providers.mailgun')
const mailgun = require('mailgun-js')
const logger = require('@open-age/logger')('api.messages')
const template = require('../helpers/template')
const support = require('config').get('support')

var templateSetter = function (scrum, info) {
    var format = template.formatter(scrum)
    return format.inject(info)
}

exports.reportBug = function (req, res) {
    let body = template.formatter(`Hi Admin,
    <br>
    <br>
    A bug has been reported by <b>{{name}} </b>
    <br>
    <br>
    <b>Phone : {{phone}} </b>
    <br>
    <br>
    <b>DeviceId : {{deviceId}} </b>
    <br>
    <br>
    <b>Description : </b>
    <br>
    <br>
    {{description}}`).inject({
        name: req.context.employee.name,
        phone: req.context.employee.phone,
        description: req.body.description,
        deviceId: req.device && req.device.id ? req.device.id : null
    })

    let provider = require(`../providers/${mailer.provider}`)

    let config = providerConfigs

    return provider.email({
        subject: 'Bug Reported',
        body: body
    }, {
        email: support.email
    }, config, req.context)
        .then(() => res.success('mail sent')).catch(err => res.failure(err))
}
