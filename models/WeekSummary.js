'use strict'
var mongoose = require('mongoose')
let findOneOrCreate = require('mongoose-find-one-or-create')
// let findOrCreate = require('findorcreate-promise');

var entity = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    hoursWorked: { type: Number, default: 0 }, // total worked hours
    attendanceCount: { type: Number, default: 0 },
    weekStart: Date, // start date of week(monday)
    weekEnd: Date, // date of comming sunday
    // avgHours: Number, //avg hours worked in week,
    attendances: [{ type: mongoose.Schema.Types.ObjectId, ref: 'attendance' }],

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

entity.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

entity.plugin(findOneOrCreate)
// weekSummary.plugin(findOrCreate);
mongoose.model('weekSummary', entity)
