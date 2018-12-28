'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')

var yearSummary = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    endMonth: Date,
    startMonth: Date,
    hoursWorked: { type: Number, default: 0 }, // total worked hours
    attendanceCount: { type: Number, default: 0 }, // avg hours worked in week
    leaves: [{
        date: Date, // Date of leave
        leaveTypeCategory: String,
        leave: { type: mongoose.Schema.Types.ObjectId, ref: 'leave' }
    }]
})

yearSummary.pre('save', function (next) {
    next()
})

yearSummary.plugin(findOneOrCreate)
mongoose.model('yearSummary', yearSummary)
