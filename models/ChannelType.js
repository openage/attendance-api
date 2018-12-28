'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var channelType = new mongoose.Schema({
    name: String, // twilio, way2sms, slack
    category: {
        $type: String,
        enum: ['sms', 'email', 'chat']
    },
    picUrl: String,
    providerName: String,
    description: String,
    parameters: [{
        name: String,
        title: String,
        type: String,
        description: String,
        expectedValues: { $type: [String], default: [] }
    }]
}, { typeKey: '$type' })

channelType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

channelType.plugin(findOrCreate)
mongoose.model('channelType', channelType)
