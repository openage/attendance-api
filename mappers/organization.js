'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        externalUrl: entity.externalUrl,
        activationKey: entity.activationKey,
        lastSyncDate: entity.lastSyncDate,
        onBoardingStatus: entity.onBoardingStatus || 'start',
        created_At: entity.created_At
    }
    model.communicationApps = {}

    if (!_.isEmpty(entity.communicationApps)) {
        // for (var index in entity.communicationApps) {

        //     model.communicationApps[index] = {
        //         id: entity.id,
        //         type: entity.type,
        //         organization: entity.organization,
        //         status: entity.status,
        //         config: entity.config
        //     };

        // }

        if (entity.communicationApps.sms) {
            model.communicationApps.sms = {
                id: entity.communicationApps.sms.id,
                // type: entity.communicationApps.sms.type,
                organization: entity.communicationApps.sms.organization,
                status: entity.communicationApps.sms.status,
                config: entity.communicationApps.sms.config
            }

            if (entity.communicationApps.sms.type._doc) {
                model.communicationApps.sms.type = {
                    id: entity.communicationApps.sms.type.id,
                    name: entity.communicationApps.sms.type.name,
                    category: entity.communicationApps.sms.type.category,
                    description: entity.communicationApps.sms.type.description
                }
                model.communicationApps.sms.type.parameters = []
                if (!_.isEmpty(entity.communicationApps.sms.type.parameters)) {
                    _.each(entity.communicationApps.sms.type.parameters, item => {
                        model.communicationApps.sms.type.parameters.push({
                            id: item._id.toString(),
                            name: item.name,
                            title: item.title,
                            type: item.type,
                            description: item.description,
                            expectedValues: item.expectedValues
                        })
                    })
                }
            } else {
                model.communicationApps.sms.type = model.communicationApps.sms.type.toString()
            }
        }

        if (entity.communicationApps.email) {
            model.communicationApps.email = {
                id: entity.communicationApps.email.id,
                // type: entity.communicationApps.sms.type,
                organization: entity.communicationApps.email.organization,
                status: entity.communicationApps.email.status,
                config: entity.communicationApps.email.config
            }

            if (entity.communicationApps.email.type._doc) {
                model.communicationApps.email.type = {
                    id: entity.communicationApps.email.type.id,
                    name: entity.communicationApps.email.type.name,
                    category: entity.communicationApps.email.type.category,
                    description: entity.communicationApps.email.type.description
                }
                model.communicationApps.email.type.parameters = []
                if (!_.isEmpty(entity.communicationApps.email.type.parameters)) {
                    _.each(entity.communicationApps.email.type.parameters, item => {
                        model.communicationApps.email.type.parameters.push({
                            id: item._id.toString(),
                            name: item.name,
                            title: item.title,
                            type: item.type,
                            description: item.description,
                            expectedValues: item.expectedValues
                        })
                    })
                }
            } else {
                model.communicationApps.email.type = model.communicationApps.email.type.toString()
            }
        }

        if (entity.communicationApps.chat) {
            model.communicationApps.chat = {
                id: entity.communicationApps.chat.id,
                // type: entity.communicationApps.sms.type,
                organization: entity.communicationApps.chat.organization,
                status: entity.communicationApps.chat.status,
                config: entity.communicationApps.chat.config
            }

            if (entity.communicationApps.chat.type._doc) {
                model.communicationApps.chat.type = {
                    id: entity.communicationApps.chat.type.id,
                    name: entity.communicationApps.chat.type.name,
                    category: entity.communicationApps.chat.type.category,
                    description: entity.communicationApps.chat.type.description
                }
                model.communicationApps.chat.type.parameters = []
                if (!_.isEmpty(entity.communicationApps.chat.type.parameters)) {
                    _.each(entity.communicationApps.chat.type.parameters, item => {
                        model.communicationApps.chat.type.parameters.push({
                            id: item._id.toString(),
                            name: item.name,
                            title: item.title,
                            type: item.type,
                            description: item.description,
                            expectedValues: item.expectedValues
                        })
                    })
                }
            } else {
                model.communicationApps.chat.type = model.communicationApps.chat.type.toString()
            }
        }
    }

    return model
}
