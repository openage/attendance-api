'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,
    entity: {
        type: String
    },
    data: String,

    progress: Number,
    error: Object,

    status: {
        type: String
    },
    meta: Object,
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    employee: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'employee'
        },
        code: Number
    },

    action: String,
    assignedTo: String,

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
