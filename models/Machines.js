'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var machine = new mongoose.Schema({
    model: String,
    manufacturer: String,
    picUrl: String,
    picData: String,
    status: String,
    port: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' }
})

machine.plugin(findOrCreate)
mongoose.model('machine', machine)
