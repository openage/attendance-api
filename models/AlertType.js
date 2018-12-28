'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

var alertType = new mongoose.Schema({
    code: { $type: String, trim: true, lowercase: true},
    name: String,
    description: String,
    picUrl: String,
    default: { $type: Boolean, default: false },
    cost: Number,
    hasInsights: Boolean,
    hasReports: Boolean,
    hasNotifications: Boolean,
    priority: { $type: Number, default: 3 },
    trigger: {
        entity: String, // attendance
        action: String, // check-in
        parameters: [{
            name: String,
            title: String,
            type: String,
            description: String,
            expectedValues: [String]
        }]
    },
    processor: {
        comApp: [String],
        name: String, // notify-employuee
        category: String, // notification, payRole, EmpDb
        parameters: [{
            name: String,
            title: String,
            type: String,
            description: String
        }]
    }
}, { typeKey: '$type' })

alertType.plugin(findOrCreate)
mongoose.model('alertType', alertType)
