'use strict'
var mongoose = require('mongoose')
module.exports = {
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

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
