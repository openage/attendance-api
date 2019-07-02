'use strict'
let mongoose = require('mongoose')

let locationLog = new mongoose.Schema({
    attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'attendance' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
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

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

locationLog.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('locationLog', locationLog)
