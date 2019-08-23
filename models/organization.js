'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    shortName: String,
    logo: {
        url: String,
        thumbnail: String
    },
    externalId: String,
    devicesVersion: String, // the config version
    activationKey: String, // uuid form
    lastSyncDate: Date,
    config: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
    },
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'device' }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
