'use strict'
const appRoot = require('app-root-path')
const shiftTypes = require(`${appRoot}/services/shift-types`)
const organizations = require(`${appRoot}/services/organizations`)
const logger = require('@open-age/logger')('organization.create.defaults.create-gen-shift')

exports.process = (data, context, onDone, onProgress) => {
    organizations.getById(data.id, (err, org) => {
        if (err) {
            return onDone(err)
        }
        shiftTypes.create({
            code: 'gen',
            name: 'General',
            organization: org
        }, onDone)
    })
}
