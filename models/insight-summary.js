'use strict'
let mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

let insightSummary = new mongoose.Schema({
    date: { type: Date }, // Date on which
    type: { type: String, default: 'daily' }, // daily, weekly, monthly, yearly
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },

    // updated by processors
    my: [{ //           team total, hours worked, distance travelled, picnic preference, sales (target)
        insight: { type: mongoose.Schema.Types.ObjectId, ref: 'insight' },
        values: [{
            key: String, // members, hours , kms ,[ rose garden, kausali, shimla ], [target, achieved]
            value: Number // 2     , 8     , 5   ,[  1,          3,       2]      , [10,     0]
        }],
        notes: String
    }],

    team: [{ //           team total, hours worked, distance travelled
        insight: { type: mongoose.Schema.Types.ObjectId, ref: 'insight' },
        values: [{
            key: String, // members, hours , kms ,[ rose garden, kausali, shimla ], [target, achieved]
            value: Number // 5     , 40    , 32  ,[  14,         10,       5     ], [50,    15]
        }]
    }],

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

insightSummary.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

insightSummary.plugin(findOrCreate)
mongoose.model('insightSummary', insightSummary)
