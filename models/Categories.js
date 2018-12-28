'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var category = new mongoose.Schema({
    name: String,
    machines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'machine' }] // that we support
})

category.plugin(findOrCreate)
mongoose.model('category', category)
