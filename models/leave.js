'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date, // fromDate
    toDate: Date, // toDate
    days: Number,
    isPlanned: Boolean,
    units: Number,
    start: {
        first: Boolean,
        second: Boolean
    },
    end: {
        first: Boolean,
        second: Boolean
    },
    status: {
        type: String,
        enum: ['submitted', 'approved', 'cancelled', 'rejected']
    },
    reason: String,
    comment: String,
    externalId: String,
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveType' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
