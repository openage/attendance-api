'use strict'

var mongoose = require('mongoose')

var holiday = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    name: String,
    date: Date,

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

holiday.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('holiday', holiday)
