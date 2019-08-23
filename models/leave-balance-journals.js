'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,
    units: Number,
    action: String,
    leaveBalance: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveBalance' },
    entity: {
        id: String,
        type: { type: String }
    },
    meta: Object,
    comment: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
