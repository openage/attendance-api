'use strict'

var mongoose = require('mongoose')

var entity = new mongoose.Schema({
    date: Date,
    units: Number,
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveBalance' },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

entity.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('leaveBalanceJournal', entity)
