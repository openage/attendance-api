'use strict'
var mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

// var alertName = `Late to office ${number||'NUMBER'} time in row`;

var insight = new mongoose.Schema({

    title: String,
    // default value = type.name
    // Picnic Poll,
    // Daily Sales Report
    // Does your boss knows his work?
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'insightType'
    },
    // team total,
    // hours worked,
    // distance travelled,
    // poll
    // target
    // 360
    config: {
        trigger: Object, // in this org/employee specific params will be present
        // options - rose garden, kausali, shimla
        // selectionMode - only one, priority
        // {  of type target
        //     duration: monthly
        //     units: 'Nos'
        //     value:  50
        //     result:  0
        //     start:  02-02-2018
        //     end:  02-03-2018
        //     reminder: daily
        //     time: 18:00
        // }

        /* {
            options: [ 'rose garden', 'kausali', 'shimla']
            reminder: once
            selectionMode: 'only one', 'multiple', 'priority'
            start:  02-02-2018
            end:  02-03-2018 // becomes inactive after this day - if user tries to take action after end date
            '{{title.name}} has expired'
        } */

        // {
        //     options: [ 'Have you brushed your teeth', 'Have you finished your milk']
        //     selectionMode: 'multiple'
        //     reminder: daily
        //     time: 8:00
        // }
        // {
        //     options: [ 'Does he help you', 'Does he respect your work']
        //     keys: [{ key: 'Always', value: 3}, { key: 'Not Sure', value: 2}, { key: 'Never', value: 1}]
        //     fromValue: 0
        //     tillValue: 10
        //     reminder: monthly
        //     time: 8:00
        // }
        processor: Object // in this channel will be present
        // {
        //     subject: 'How may printers were sold today?'
        // },
        // {
        //     subject: 'Where do you want to go for picnic?'
        // }
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    employee: { // null - if set is applicable to whole team
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employee'
    },

    status: { type: String, default: 'active' }, // active, inactive

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})

insight.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

insight.plugin(findOrCreate)
mongoose.model('insight', insight)
