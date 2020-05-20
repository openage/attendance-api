'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,
    name: String,
    description: String,
    status: String,
    departments: [{ type: String }],
    divisions: [{ type: String }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
