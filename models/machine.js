'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    model: String,
    manufacturer: String,
    picUrl: String,
    picData: String,
    status: String,
    port: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
