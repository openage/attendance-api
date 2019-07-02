'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var tag = new mongoose.Schema({
    name: { type: String },
    tagType: { type: mongoose.Schema.Types.ObjectId, ref: 'tagType' },
    status: { type: String, default: 'active' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

tag.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

tag.plugin(findOrCreate)
mongoose.model('tag', tag)
