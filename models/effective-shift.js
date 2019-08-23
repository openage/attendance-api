'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,
    status: String,
    shiftType: { type: mongoose.Schema.Types.ObjectId, ref: 'shiftType' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
