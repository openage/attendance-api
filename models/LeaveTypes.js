'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')
let findOrCreate = require('findorcreate-promise')

var leaveType = new mongoose.Schema({
    unitsPerDay: Number,
    name: String,
    code: String,
    unlimited: {
        type: Boolean,
        default: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    category: {
        type: String,
        enum: ['lossOfPay', 'OnDuty', 'paidLeave', 'compensatory']
    },
    periodicity: {
        value: Number,
        type: {
            type: String,
            enum: ['manual', 'fortnightly', 'monthly', 'quarterly', 'yearly']
        }
    },
    carryForward: Number,
    monthlyLimit: Number

})

leaveType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})
leaveType.plugin(findOneOrCreate)
leaveType.plugin(findOrCreate)

mongoose.model('leaveType', leaveType)
