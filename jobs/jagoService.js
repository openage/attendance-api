'use strict'
let cron = require('cron').CronJob
let db = global.db
const logger = require('@open-age/logger')('jagoService')
let oneSignal = require('../providers/oneSignal')

var start = (startOn) => {
    new cron({
        cronTime: startOn,
        onTick: () => {
            return db.employee.find({ 'device.id': { $exists: true, $ne: null } })
                .then(employees => {
                    return Promise.each(employees, employee => {
                        return oneSignal.push({
                            'subject': 'Aqua',
                            'message': 'wifi'
                        }, employee)
                    })
                }).catch(err => {
                    return Promise.cast(null)
                })
        },
        start: true
    })
}

exports.schedule = () => {
    logger.error('disabled')
    // start(`10 39 * * * *`);
}
