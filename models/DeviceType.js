'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var device = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'machine' },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

device.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

device.plugin(findOrCreate)
mongoose.model('deviceType', device)
