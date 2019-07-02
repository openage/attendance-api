'use strict'
var mongoose = require('mongoose')

var effectiveShift = new mongoose.Schema({
    date: Date,
    status: String,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    shiftType: { type: mongoose.Schema.Types.ObjectId, ref: 'shiftType' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    // updatedAt: { type: Date, default: Date.now },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

effectiveShift.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('effectiveShift', effectiveShift)
