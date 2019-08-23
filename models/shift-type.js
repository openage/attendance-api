'use strict'
var mongoose = require('mongoose')
module.exports = {
    name: String,
    code: String,
    color: { type: String, default: '#000000' },

    isDynamic: Boolean,
    autoExtend: Boolean, // minutes

    unitsPerDay: Number,
    startTime: Date,
    endTime: Date,

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

    department: { type: String, default: '' },
    division: { type: String, default: '' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
