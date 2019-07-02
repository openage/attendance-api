'use strict'
var mongoose = require('mongoose')

var deviceLog = new mongoose.Schema({
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'device' },
    description: String,
    status: String,

    created_At: { type: Date, default: Date.now }
})

mongoose.model('deviceLog', deviceLog)
