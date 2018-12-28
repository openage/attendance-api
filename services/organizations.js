'use strict'
const uuid = require('uuid')
const offline = require('@open-age/offline-processor')
const db = require('../models')

exports.create = (model, callback) => {
    var data = {
        code: model.code,
        name: model.name,
        externalUrl: model.externalUrl,
        activationKey: uuid.v1()
    }

    new db.organization(data)
        .save()
        .then(organization => {
            if (!organization) {
                return callback(`could not create the organization`)
            }

            offline.queue('organization', 'create', {
                id: organization.id
            }, {
                organization: {
                    id: organization.id
                }
            }, (err) => {
                callback(err, organization)
            })
        })
        .catch(err => callback(err))
}
