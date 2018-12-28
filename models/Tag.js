'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var tag = new mongoose.Schema({
    name: { type: String },
    tagType: { type: mongoose.Schema.Types.ObjectId, ref: 'tagType' },
    status: { type: String, default: 'active' }
})

tag.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

tag.plugin(findOrCreate)
mongoose.model('tag', tag)
