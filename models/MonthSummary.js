'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')
let leavesSchema = require('../models/Leaves')
let attendanceSchema = require('../models/Attendence')

var entity = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee',
        required: [true, 'employee required']
    },

    month: Date,
    weekEnd: Date, // date of comming sunday
    weekStart: Date, // start date of week(monday)

    standardDeviation: {
        type: Number,
        default: 0
    },

    employeeModel: {
        type: Object
    },

    supervisor: {
        type: Object
    },

    status: {
        type: String,
        enum: ['lock', 'unlock']
    },

    attendances: { type: Array, default: [] },

    leaves: { type: Array, default: [] },

    leavesSummary: [{
        code: String,
        count: Number
    }],

    attendanceSummary: {
        count: Number,
        present: Number,
        absent: Number,
        holiday: Number,
        weekOff: Number,
        missedSwipes: Number,
        firstHalfPresent: Number,
        secondHalfPresent: Number,

        leaves: Number,
        minutes: Number,
        overTime: Number,
        overTimeCount: Number,

        shifts: Number,
        lateCount: Number,
        earlyCount: Number
    },

    shiftSummary: [{ name: String, count: Number }],

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },

    created_At: {
        type: Date,
        default: Date.now
    },

    timeStamp: {
        type: Date,
        default: Date.now
    }
})

entity.index({
    employee: 1,
    month: 1
}, {
    unique: true
})

entity.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

entity.plugin(findOneOrCreate)
mongoose.model('monthSummary', entity)
