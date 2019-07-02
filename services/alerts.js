'use strict'
const db = require('../models')

const getDefaultConfigurations = alertType => {
    let defaultConf = {
        trigger: {},
        processor: {
            channel: 'sms'
        }
    }

    alertType.trigger.parameters.forEach(item => {
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

exports.addDefaults = async (context) => {
    let alertTypes = db.alertType.find({ default: true })
    for (const alertType of alertTypes) {
        await new db.alert({
            alertType: alertType,
            organization: context.organization,
            config: getDefaultConfigurations(alertType)
        }).save()
    }
}

exports.setDefaultConfigurations = getDefaultConfigurations
