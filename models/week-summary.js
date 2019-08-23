'use strict'
var mongoose = require('mongoose')
module.exports = {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    hoursWorked: { type: Number, default: 0 }, // total worked hours
    attendanceCount: { type: Number, default: 0 },
    weekStart: Date, // start date of week(monday)
    weekEnd: Date, // date of comming sunday
    // avgHours: Number, //avg hours worked in week,
    attendances: [{ type: mongoose.Schema.Types.ObjectId, ref: 'attendance' }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
