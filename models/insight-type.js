'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var insightType = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        lowercase: true
    },
    name: String, // target, poll (with options), team-count,
    description: String,
    category: String,
    pic: {
        url: String,
        thumbnail: String
    },
    default: { type: Boolean, default: false },
    cost: Number,
    trigger: {
        entity: String, // employee    , attendance, location log, cron
        action: String, // team-changed, check-out,              , morning
        parameters: [{
            name: String,
            title: String,
            type: { type: String },
            description: String,
            expectedValues: [String]
        }]
    },
    processor: {
        name: String,
        // team-total,
        // hours-worked,
        // distance-travelled,
        // template: String, would be calculated by the processor insight-type-{{code}}-{{selectionMode}}, insight-type-poll
        summaryCalculator: String, // total, count
        parameters: [{
            name: String,
            title: String,
            type: String,
            description: String
        }]
    },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

insightType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

insightType.plugin(findOrCreate)
mongoose.model('insightType', insightType)
