'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var device = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    machine: { type: mongoose.Schema.Types.ObjectId, ref: 'machine' }
})

device.plugin(findOrCreate)
mongoose.model('deviceType', device)
