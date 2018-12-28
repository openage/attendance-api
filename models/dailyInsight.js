'use strict'
let mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

let insight = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
    alert: { type: mongoose.Schema.Types.ObjectId, ref: 'alert' },
    onHome: { type: Boolean, default: false },
    date: { type: Date }, // Date on which
    statistics: {
        params: [{
            key: {type: String, lowercase: true, trim: true},
            value: String,
            count: Number
        }], // same as trigger model in config of alert + count
        count: Number
    }
})

insight.plugin(findOrCreate)
mongoose.model('dailyInsight', insight)
