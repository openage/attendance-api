'use strict'
let mongoose = require('mongoose')

let biometric = new mongoose.Schema({
    marks: [String],
    status: String,
    code: String,
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'device' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

biometric.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('biometric', biometric)
