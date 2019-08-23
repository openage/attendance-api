'use strict'
var mongoose = require('mongoose')
module.exports = {
    status: {
        type: String,
        enum: ['checkedIn', 'absent', 'present', 'onLeave', 'missSwipe', 'holiday', 'halfday', 'weekOff', 'checked-in-again']
    },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    ofDate: { type: Date }, // latest Punch Time
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'shift' },
    shiftType: { type: mongoose.Schema.Types.ObjectId, ref: 'shiftType' },
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
    hours: String,
    needsAction: String,
    checkInStatus: String,
    checkOutStatus: String,
    firstHalfStatus: String,
    secondHalfStatus: String,
    late: Number, // minutes
    early: Number, // minutes
    comment: String,
    isContinue: Boolean,
    overTime: Number, // minutes

    team: {
        teamCount: { type: Number },
        teamWorked: { type: Number },
        presentCount: { type: Number },
        absentCount: { type: Number },
        lateCount: { type: Number },
        leaveCount: { type: Number },
        activeCount: { type: Number }
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
