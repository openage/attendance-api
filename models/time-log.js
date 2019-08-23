'use strict'
var mongoose = require('mongoose')
module.exports = {
    type: {
        type: String,
        enum: ['checkIn', 'checkOut']
    },
    ignore: Boolean,
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'device' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    time: Date,
    location: {
        coordinates: {
            type: [Number], // [<longitude>, <latitude>]
            index: '2dsphere' // create the geospatial index
        },
        name: String,
        description: String
    },
    source: {
        type: String,
        enum: ['biometricDevice', 'androidDevice', 'iosDevice', 'byAdmin', 'wifi', 'system'],
        default: 'biometricDevice'
    },
    attendanceId: String,
    decision: Object,
    ipAddress: String,
    isComputed: { type: Boolean, default: false },
    isUpdated: { type: Boolean, default: false },

    uploadedTime: { type: Date, default: Date.now },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
