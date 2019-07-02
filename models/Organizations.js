'use strict'

var mongoose = require('mongoose')

var organization = new mongoose.Schema({
    name: String,
    EmpDb_Org_id: String,
    owner: {
        id: String
    },
    code: { type: String, lowercase: true },
    externalUrl: String,
    externalId: String,
    devicesVersion: String,
    activationKey: String, // uuid form
    lastSyncDate: Date,
    config: Object,
    onBoardingStatus: {
        type: String,
        enum: [
            'start', 'employees', 'devices', 'syncapp', 'alerts', 'complete'
        ],
        default: 'start'
    },
    status: {
        type: String,
        enum: [
            'active', 'inactive'
        ],
        default: 'active'
    },
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'device' }],
    channels: [{
        channelType: { type: mongoose.Schema.Types.ObjectId, ref: 'channelType' },
        status: { type: String, default: 'active' },
        config: Object
    }],

    employeeSource: { type: mongoose.Schema.Types.ObjectId, ref: 'channel' },

    communicationApps: {

        // all my configurations which are in use
        sms: { type: mongoose.Schema.Types.ObjectId, ref: 'channel' },
        email: { type: mongoose.Schema.Types.ObjectId, ref: 'channel' },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: 'channel' }
    },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

organization.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

mongoose.model('organization', organization)
