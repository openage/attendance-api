'use strict'
const mongoose = require('mongoose')
const findOrCreate = require('findorcreate-promise')
const findOneOrCreate = require('mongoose-find-one-or-create')

var task = new mongoose.Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'device'
    },
    employee: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'employee'
        },
        code: Number
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    entity: String,
    action: String,
    assignedTo: String,
    data: String,
    date: Date,
    status: String,
    progress: Number,
    meta: Object,
    error: Object,

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

task.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

task.plugin(findOrCreate)
task.plugin(findOneOrCreate)

mongoose.model('task', task)
