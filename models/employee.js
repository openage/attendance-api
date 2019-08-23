'use strict'
var mongoose = require('mongoose')
module.exports = {
    trackingId: String,
    EmpDb_Emp_id: String, // tracking id TODO: obsolete
    type: { type: String }, // student or employee

    role: {
        id: { type: String },
        key: { type: String },
        code: String,
        permissions: [{ type: String }]
    },
    name: String,
    code: String,

    phone: String,
    email: String,

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

    status: String,
    deactivationDate: {
        type: Date
    },

    fatherName: String,
    dob: Date,
    gender: String,
    picData: {
        type: String,
        default: ''
    },
    picUrl: {
        type: String,
        default: null
    },

    reportees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'employee' }],

    biometricCode: String,

    abilities: {
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
    },

    config: Object,

    contractor: {
        type: String,
        default: ''
    },
    designation: {
        type: String,
        default: ''
    },
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
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
