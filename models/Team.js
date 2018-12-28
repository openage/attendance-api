'use strict'
const mongoose = require('mongoose')
const findOrCreate = require('findorcreate-promise')
const findOneOrCreate = require('mongoose-find-one-or-create')

var team = new mongoose.Schema({
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // SupervisorId
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }
})

team.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

team.plugin(findOrCreate)
team.plugin(findOneOrCreate)

mongoose.model('team', team)
