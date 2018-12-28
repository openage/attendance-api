'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')
let findOrCreate = require('findorcreate-promise')

var attendance = new mongoose.Schema({
    // minutes: Number,
    status: {
        type: String,
        enum: ['checkedIn', 'absent', 'present', 'onLeave', 'holiday', 'missSwipe', 'halfday', 'weekOff', 'checked-in-again']
    },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    ofDate: { type: Date }, // latest Punch Time
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'shift' },
    recentMostTimeLog: { type: mongoose.Schema.Types.ObjectId, ref: 'timeLog' },
    timeLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'timeLog' }],
    minutes: Number, // in minutes
    count: Number, // no of shifts worked
    checkIn: Date, // main checkin
    checkOut: Date, // main checkout
    checkOutExtend: Date,
    hoursWorked: Number,
    minsWorked: Number,
    isGrace: Boolean,
    team: {
        teamCount: { type: Number },
        teamWorked: { type: Number },
        presentCount: { type: Number },
        absentCount: { type: Number },
        lateCount: { type: Number },
        leaveCount: { type: Number },
        activeCount: { type: Number }
    },
    created_At: { type: Date, default: Date.now }

})

attendance.pre('save', function (next) {
    this.created_At = Date.now()
    next()
})
attendance.plugin(findOneOrCreate)
attendance.plugin(findOrCreate)
mongoose.model('attendance', attendance)
