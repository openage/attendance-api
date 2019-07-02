'use strict'
const mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

let reportRequests = new mongoose.Schema({
    type: { type: String },
    provider: {
        type: String,
        enum: [
            'ams', 'ems'
        ],
        default: 'ams'
    },
    requestedAt: Date,
    startedAt: Date,
    completedAt: Date,
    filePath: String,
    fileUrl: String,
    reportParams: String,
    error: String,
    status: {
        type: String,
        enum: ['new', 'in-progress', 'ready', 'cancelled', 'errored']
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

reportRequests.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

reportRequests.plugin(findOrCreate)
mongoose.model('reportRequests', reportRequests)
