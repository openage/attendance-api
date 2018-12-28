'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var channel = new mongoose.Schema({
    type: { $type: mongoose.Schema.Types.ObjectId, ref: 'channelType' },
    organization: { $type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    status: { $type: String, default: 'active' },
    config: Object
}, { typeKey: '$type' })

channel.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

channel.plugin(findOrCreate)
mongoose.model('channel', channel)
