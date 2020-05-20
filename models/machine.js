'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    model: String,
    manufacturer: String,
    pic: {
        url: String,
        thumbnail: String
    },
    status: String,
    port: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
