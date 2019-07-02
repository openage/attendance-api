'use strict'
let mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

let report = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: 'alert' },
    requestedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    filePath: { type: String },
    fileUrl: { type: String },
    error: { type: String },
    params: { type: Object },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'ready', 'cancelled', 'errored']
    },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

report.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

report.plugin(findOrCreate)
mongoose.model('report', report)
