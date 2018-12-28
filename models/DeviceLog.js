'use strict'
var mongoose = require('mongoose')

var deviceLog = new mongoose.Schema({
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'device' },
    created_At: { type: Date, default: Date.now },
    description: String,
    status: String
})

mongoose.model('deviceLog', deviceLog)
