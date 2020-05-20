'use strict'
var mongoose = require('mongoose')
module.exports = {
    trackingId: String, // TODO rename to externalId
    code: String,
    phone: String,
    email: String,

    role: {
        id: { type: String },
        key: { type: String },
        code: String,
        permissions: [{ type: String }]
    },

    type: { type: String }, // student or employee

    profile: {
        firstName: String,
        lastName: String,
        gender: String,
        dob: Date,
        pic: {
            url: String,
            thumbnail: String
        }
    },

    biometricCode: String,

    status: String,

    config: Object,
    meta: Object,

    department: {
        type: String,
        default: ''
    },
    division: {
        type: String,
        default: ''
    },

    shiftType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shiftType'
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },

    isDynamicShift: Boolean,
    weeklyOff: {
        monday: Boolean,
        tuesday: Boolean,
        wednesday: Boolean,
        thursday: Boolean,
        friday: Boolean,
        saturday: Boolean,
        sunday: Boolean,
        isConfigured: Boolean
    },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' },

    reportees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'employee' }], // obsolete

    name: String, // obsolete - user profile
    deactivationDate: Date, // obsolete
    fatherName: String, // obsolete - use meta
    dob: Date, // obsolete - user profile
    gender: String, // obsolete - user profile
    picData: String, // obsolete - user profile
    picUrl: String, // obsolete - user profile

    contractor: String, // obsolete - use meta
    designation: String, // obsolete - use meta

    abilities: { // obsolete - use config
        maualAttendance: {
            type: Boolean,
            default: false
        },
        shiftNotifier: {
            type: Boolean,
            default: true
        },
        trackLocation: {
            type: Boolean,
            default: false
        },
        manualByBeacon: {
            type: Boolean,
            default: false
        },
        manualByWifi: {
            type: Boolean,
            default: false
        },
        manualByGeoFencing: {
            type: Boolean,
            default: false
        }
    }
}
