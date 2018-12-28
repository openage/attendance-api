'use strict'
const mapper = require('../mappers/alert')
const _ = require('underscore')
const offline = require('@open-age/offline-processor')
const db = require('../models')

let setDefaultConfigurations = alertType => {
    let defaultConf = {
        trigger: {},
        processor: {
            channel: 'sms'
        }
    }

    _.each(alertType.trigger.parameters, item => {
        if (item.type === 'Number') {
            defaultConf.trigger[item.name] = 15
            return
        }

        if (item.type === 'Boolean') {
            defaultConf.trigger[item.name] = false
            return
        }

        if (item.type === 'String') {
            defaultConf.trigger[item.name] = 'no'
        }
    })
    return defaultConf
}
exports.setDefaultConfigurations = setDefaultConfigurations

let configureTrigger = (triggersToUpdate, alertType) => {
    let triggerModel = {}
    for (var key in triggersToUpdate) {
        var alertTrigger = _.find(alertType.trigger.parameters, param => {
            return key === param.name
        })

        if (alertTrigger.type && alertTrigger.type.toLowerCase() === 'number') {
            triggerModel[key] = Number(triggersToUpdate[key]) || 15
        }

        if (alertTrigger.type && alertTrigger.type.toLowerCase() === 'boolean') {
            if (triggersToUpdate[key] === 'false') {
                triggerModel[key] = false
            }

            if (triggersToUpdate[key] === 'true') {
                triggerModel[key] = true
            }
            triggersToUpdate[key] = false
        }

        if (alertTrigger.type && alertTrigger.type.toLowerCase() === 'string') {
            triggerModel[key] = triggersToUpdate[key] || 'no'
        }
    }
    return triggerModel
}

exports.create = (req, res) => {
    let model = req.body

    if (!model.name) {
        return res.failure('name is required')
    }
    if (!model.alertType) {
        return res.failure('alertType is required')
    }
    if (!model.handlerName) {
        return res.failure('handlerName is required')
    }
    let data = {
        name: model.name,
        isDefault: model.isDefault,
        code: model.code,
        parameters: model.parameters,
        alertType: model.alertType,
        handlerName: model.handlerName
    }

    db.alert.findOrCreate({
        code: data.code,
        name: {
            $regex: data.name,
            $options: 'ig'
        }
    }, data)
        .then(figures => {
            if (!figures.created) {
                throw new Error('alert already exist')
            }
            if (figures.result.isDefault) {
                var context = {}
                context.organization = {}
                context.employee = req.employee.id.toString()
                context.organization.id = req.employee.organization.toString()
                context.processSync = true
                return offline.queue('organization', 'alerts', { alert: figures.result }, context)
            }
            return res.data(mapper.toModel(figures.result))
        }).catch(err => res.failure(err))
}

exports.subscribeAlert = (req, res) => {
    let alertTypeId = req.params.id
    var myOrg = req.context.organization

    db.alert.findOne({
        alertType: alertTypeId,
        organization: myOrg.id
    })
        .then(alert => {
            if (alert) {
                throw new Error('you have already subscribed this alert')
            }
            return db.alertType.findById(alertTypeId)
        })
        .then(alertType => {
            // let defaultConfigurations = setDefaultConfigurations(alertType);

            return new db.alert({
                alertType: alertTypeId,
                organization: myOrg
            }).save()
        })
        .then(alert => {
            return res.data(mapper.toModel(alert))
        })
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    // default=true
    // subscribed=true
    let myOrg = req.context.organization

    db.alert.find({
        organization: myOrg
    })
        .populate('alertType')
        .then(alerts => {
            return alerts
        })
        .then(alerts => {
            res.page(mapper.toSearchModel(alerts))
        })
        .catch(err => res.failure(err))
}

exports.update = (req, res) => {
    var alertId = req.params.id
    var model = req.body

    db.alert.findById(alertId)
        .populate('alertType')
        .then(alert => {
            if (!alert) {
                throw new Error('you have not subscribed this alert yet')
            }

            if (model.config.trigger) {
                model.config.trigger = configureTrigger(model.config.trigger, alert.alertType)
            }

            if (model.config.processor.channel === '' || !model.config.processor.channel) {
                // if person reset its
                return { alert: alert }
            }

            return db.channelType.findOne({
                category: model.config.processor.channel
            })
                .then(channelType => {
                    if (!channelType) {
                        throw new Error('no channel found')
                    }
                    return { alert: alert, channel: channelType }
                })
        })
        .then(data => {
            data.alert.config = {
                processor: {
                    channel: model.config.processor
                        ? model.config.processor.channel : data.alert.config.processor.channel
                },
                trigger: model.config.trigger ? model.config.trigger : data.alert.config.trigger || {}
            }
            data.alert.status = model.status ? model.status : data.alert.status

            return data.alert.save()
        })
        .then(alert => {
            return res.data(mapper.toModel(alert))
        })
        .catch(err => res.failure(err))
}

exports.get = (req, res) => {
    let alertId = req.params.id

    db.alert.findById(alertId)
        .populate('alertType')
        .then(alert => {
            if (!alert) {
                throw new Error('no alert found')
            }
            return res.data(mapper.toModel(alert))
        })
        .catch(err => res.failure(err))
}
