'use strict'
let mongoose = require('mongoose')

let fingerPrint = new mongoose.Schema({
    marks: [String],
    status: String,
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee'},
    updatedAt: { type: Date, default: Date.now }
})

fingerPrint.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('fingerPrint', fingerPrint)
