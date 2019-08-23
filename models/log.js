'use strict'
var mongoose = require('mongoose')
module.exports = {
    level: String,
    message: String,
    meta: Object,

    app: String,
    location: String,
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    attendance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'attendance'
    },
    timeLog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timeLog'
    },
    shiftType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shiftType'
    },
    holiday: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'holiday'
    },
    leave: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leave'
    },
    leaveType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leaveType'
    },
    leaveBalance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leaveBalance'
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    timeStamp: { type: Date, default: Date.now }
}
