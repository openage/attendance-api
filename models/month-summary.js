'use strict'
var mongoose = require('mongoose')
module.exports = {
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

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}

// entity.index({
//     employee: 1,
//     month: 1
// }, {
//         unique: true
//     })
