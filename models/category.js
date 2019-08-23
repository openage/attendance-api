'use strict'

var mongoose = require('mongoose')
module.exports = {
    name: String,
    machines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'machine' }], // that we support
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
