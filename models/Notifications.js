'use strict'
var mongoose = require('mongoose')
var notification = new mongoose.Schema({
    date: Date,
    subject: String,
    message: String,
    // active,inactive,archive
    status: { type: String, default: 'inactive' }, // inactive when user cannot makes actions
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // person who has to perform action
    task: { // action tobe performed
        type: { type: String }, // can be leave or anything on which action can perform etc
        id: { type: mongoose.Schema.Types.ObjectId }, // can be leave Id etc
        actions: [String]
    },
    data: {
        api: String,
        action: String,
        entity: {
            id: String,
            type: { type: String },
            picUrl: String,
            picData: String,
            phone: String,
            lastDays: Number,
            date: Date,
            coordinates: {
                type: [Number], // [<longitude>, <latitude>]
                index: '2dsphere' // create the geospatial index
            }

        }
    }
})
mongoose.model('notification', notification)
