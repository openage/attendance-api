'use strict'

var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')
let findOneOrCreate = require('mongoose-find-one-or-create')

var shift = new mongoose.Schema({
    date: Date,

    status: {
        type: String,
        enum: ['working', 'holiday', 'weekOff'] // TODO half day working be present
    }, //    may set as holiday but admin can change to  -- working

    shiftType: { type: mongoose.Schema.Types.ObjectId, ref: 'shiftType' },
    created_At: { type: Date, default: Date.now },
    holiday: { type: mongoose.Schema.Types.ObjectId, ref: 'holiday' }
})

shift.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

shift.plugin(findOrCreate)
shift.plugin(findOneOrCreate)
mongoose.model('shift', shift)
