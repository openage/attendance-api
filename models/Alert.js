'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

// var alertName = `Late to office ${number||'NUMBER'} time in row`;

var alert = new mongoose.Schema({
    alertType: { type: mongoose.Schema.Types.ObjectId, ref: 'alertType' },
    // TODO: renamed this to type
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    config: {
        trigger: Object, // in this org specific params will be present
        processor: Object // in this channel will be present
    },
    status: { type: String, default: 'active' } // active, inactive
})

alert.plugin(findOrCreate)
mongoose.model('alert', alert)
