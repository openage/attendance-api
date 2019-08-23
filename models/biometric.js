'use strict'
var mongoose = require('mongoose')
module.exports = {
    marks: [String],
    status: String,
    code: String,
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'device' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
