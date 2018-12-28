'use strict'

var mongoose = require('mongoose')

var LeaveBalanceJournal = new mongoose.Schema({
    date: Date,
    units: Number,
    action: {
        type: String,
        enum: ['absent', 'present', 'onLeave']
    }
})

LeaveBalanceJournal.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('LeaveBalanceJournal', LeaveBalanceJournal)
