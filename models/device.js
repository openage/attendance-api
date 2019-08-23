'use strict'

var mongoose = require('mongoose')
module.exports = {
    name: String,
    ip: String,
    port: String,
    type: {
        type: String,
        enum: ['in', 'out', 'master', 'both', 'parse']
    },
    location: {
        coordinates: {
            type: [Number], // [<longitude>, <latitude>]
            index: '2dsphere' // create the geospatial index
        },
        name: String,
        description: String
    },
    mute: [{
        start: { type: Date },
        end: { type: Date }
    }],
    interval: Number,
    serialNo: String,
    bssid: String, // for Wifi
    prefix: { type: String, default: '0' }, // for bimetrics

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'machine' },

    status: String,
    lastSeen: { type: Date },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
