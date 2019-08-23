'use strict'
var mongoose = require('mongoose')
module.exports = {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    endMonth: Date,
    startMonth: Date,
    hoursWorked: { type: Number, default: 0 }, // total worked hours
    attendanceCount: { type: Number, default: 0 }, // avg hours worked in week
    leaves: [{
        date: Date, // Date of leave
        leaveTypeCategory: String,
        leave: { type: mongoose.Schema.Types.ObjectId, ref: 'leave' }
    }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
