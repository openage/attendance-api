'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')

var timeLog = new mongoose.Schema({
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
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    decision: Object,
    ipAddress: String,
    isComputed: { type: Boolean, default: false },
    isUpdated: { type: Boolean, default: false },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now },
    uploadedTime: { type: Date, default: Date.now }
})

timeLog.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})
timeLog.plugin(findOneOrCreate)

mongoose.model('timeLog', timeLog)
