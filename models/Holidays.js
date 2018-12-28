'use strict'

var mongoose = require('mongoose')

var holiday = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    name: String,
    date: Date
})

holiday.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('holiday', holiday)
