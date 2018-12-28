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
    params: {type: Object},
    status: {
        type: String,
        enum: ['new', 'in-progress', 'ready', 'cancelled', 'errored']
    }
})

report.plugin(findOrCreate)
mongoose.model('report', report)
