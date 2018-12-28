'use strict'

var mongoose = require('mongoose')

var leave = new mongoose.Schema({
    Ext_id: Number,
    date: Date, // fromDate
    toDate: Date, // toDate
    days: Number,
    isPlanned: Boolean,
    units: Number,
    start: {
        first: Boolean,
        second: Boolean
    },
    end: {
        first: Boolean,
        second: Boolean
    },
    status: {
        type: String,
        enum: ['submitted', 'approved', 'cancelled', 'rejected']
    },
    reason: String,
    comment: String,
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveType' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    updatedAt: { type: Date, default: Date.now }
})

leave.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('leave', leave)
