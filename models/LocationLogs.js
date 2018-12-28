'use strict'
let mongoose = require('mongoose')

let locationLog = new mongoose.Schema({
    attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'attendance' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    time: Date,
    ipAddress: String,
    message: String,
    location: {
        coordinates: {
            type: [Number], // [<longitude>, <latitude>]
            index: '2dsphere' // create the geospatial index
        },
        name: String,
        description: String
    }
})

mongoose.model('locationLog', locationLog)
