'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')
let findOrCreate = require('findorcreate-promise')

var leaveType = new mongoose.Schema({
    code: String,
    name: String,
    credit: Number,
    unitsPerDay: Number,

    unlimited: {
        type: Boolean,
        default: true
    },

    category: {
        type: String,
        enum: ['lossOfPay', 'OnDuty', 'paidLeave', 'compensatory']
    },
    periodicity: {
        value: Number,
        type: {
            type: String,
            enum: ['work-day', 'overtime', 'new-joiner', 'manual', 'fortnightly', 'monthly', 'quarterly', 'yearly']
        }
    },
    carryForward: Number,
    monthlyLimit: Number,

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }

})

leaveType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

leaveType.plugin(findOneOrCreate)
leaveType.plugin(findOrCreate)

mongoose.model('leaveType', leaveType)
