'use strict'
var mongoose = require('mongoose')
module.exports = {
    date: Date,

    status: {
        type: String,
        enum: ['working', 'holiday', 'weekOff'] // TODO half day working be present
    }, //    may set as holiday but admin can change to  -- working

    shiftType: { type: mongoose.Schema.Types.ObjectId, ref: 'shiftType' },
    holiday: { type: mongoose.Schema.Types.ObjectId, ref: 'holiday' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
