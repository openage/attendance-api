'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')
let findOneOrCreate = require('mongoose-find-one-or-create')

var leaveBalance = new mongoose.Schema({
    // units: {
    //     left: Number,
    //     used: {
    //         type: Number,
    //         default: 0
    //     },
    //     provided: Number // in this year
    // },
    units: Number,
    unitsAvailed: Number,
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'leaveType' }
})

leaveBalance.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})
leaveBalance.plugin(findOrCreate)
leaveBalance.plugin(findOneOrCreate)

mongoose.model('leaveBalance', leaveBalance)
