'use strict'
var mongoose = require('mongoose')
module.exports = {
    units: Number,
    unitsAvailed: Number,
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveType' },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
