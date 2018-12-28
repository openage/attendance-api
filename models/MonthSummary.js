'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')

var entity = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    weekEnd: Date, // date of comming sunday
    weekStart: Date, // start date of week(monday)
    hoursWorked: { type: Number, default: 0 }, // total worked hours
    attendanceCount: { type: Number, default: 0 },
    standardDeviation: { type: Number, default: 0 },
    attendances: [{ type: mongoose.Schema.Types.ObjectId, ref: 'attendance' }]
})

entity.pre('save', function (next) {
    next()
})

entity.plugin(findOneOrCreate)
mongoose.model('monthSummary', entity)
