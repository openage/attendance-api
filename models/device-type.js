'use strict'

var mongoose = require('mongoose')
module.exports = {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'machine' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
