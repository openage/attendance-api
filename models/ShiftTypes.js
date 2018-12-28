'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var shiftType = new mongoose.Schema({
    name: String,
    code: String,
    unitsPerDay: Number,
    startTime: Date,
    endTime: Date,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    monday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    tuesday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    wednesday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    thursday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    friday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    saturday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    sunday: {
        type: String,
        enum: ['off', 'full', 'half', 'alternate']
    },
    status: String
})

shiftType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

shiftType.plugin(findOrCreate)
mongoose.model('shiftType', shiftType)
