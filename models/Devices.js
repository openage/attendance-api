'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var device = new mongoose.Schema({
    name: String,
    ip: String,
    port: String,
    type: {
        type: String,
        enum: ['in', 'out', 'master', 'both']
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
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'machine' }
})

device.plugin(findOrCreate)
mongoose.model('device', device)
