'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var shiftType = new mongoose.Schema({
    name: String,
    code: String,
    unitsPerDay: Number,
    startTime: Date,
    endTime: Date,
    isDynamic: Boolean,
    autoExtend: Boolean, // minutes
    color: { type: String, default: '#000000' },
    grace: {
        checkIn: {
            early: {
                type: Number, // in minutes,
                default: 0,
                min: 0
            },
            late: {
                type: Number, // in minutes,
                default: 0,
                min: 0
            }
        },
        checkOut: {
            early: {
                type: Number, // in minutes,
                default: 0,
                min: 0
            },
            late: {
                type: Number, // in minutes,
                default: 0,
                min: 0
            }
        }
    },
    breakTime: Number,
    department: {
        type: String,
        default: ''
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
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
    status: String,

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

shiftType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

shiftType.plugin(findOrCreate)
mongoose.model('shiftType', shiftType)
