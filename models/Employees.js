'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')
let findOneOrCreate = require('mongoose-find-one-or-create')

var employee = new mongoose.Schema({
    name: String,
    code: String,
    displayCode: String,
    phone: String,
    email: String,
    status: String,
    picData: {
        type: String,
        default: ''
    },
    picUrl: {
        type: String,
        default: null
    },
    EmpDb_Emp_id: Number,
    Ext_token: String,
    token: String,
    dob: Date,
    gender: String,
    guid: String,
    device: {
        id: String,
        name: String,
        model: String
    },
    userType: {
        type: String,
        enum: [
            'admin', 'superadmin', 'normal'
        ],
        default: 'normal'
    },
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
    notificationSettings: [{
        group: {
            type: String
        },
        isEnabled: {
            type: Boolean,
            default: true
        }
    }],

    notifications: [{
        priority: {
            type: Number,
            default: 1
        },
        group: {
            type: String
        },
        notification: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'notification'
        },
        status: {
            type: String,
            enum: [
                'new', 'sent', 'seen'
            ],
            default: 'new'
        }
    }],

    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tag'
    }],

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

    leaveBalance: {
        units: Number
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    shiftType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shiftType'
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },
    recentLogin: {
        type: Date,
        default: Date.now
    },
    deactivationDate: {
        type: Date
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

    fingerPrints: [String],
    devices: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'device'
        },
        status: {
            type: String,
            enum: ['enable', 'disable'],
            default: 'enable'
        }
    }]

})

employee.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})
employee.plugin(findOrCreate)
employee.plugin(findOneOrCreate)
mongoose.model('employee', employee)
