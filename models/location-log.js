'use strict'
var mongoose = require('mongoose')
module.exports = {
    attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'attendance' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    time: Date,
    ipAddress: String,
    message: String,
    distance: Number,
    duration: Number,
    location: {
        coordinates: {
            type: [Number], // [<longitude>, <latitude>]
            index: '2dsphere' // create the geospatial index
        },
        name: String,
        description: String
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
