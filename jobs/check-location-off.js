'use strict'
let cron = require('cron').CronJob
const logger = require('@open-age/logger')('locationOff')
const offline = require('@open-age/offline-processor')

var start = (shiftType, startOn) => {
    var context = {}
    context.organization = {}
    context.user = null
    context.organization.id = shiftType.organization.toString()
    context.processSync = true

    let job = new cron({
        cronTime: startOn,
        onTick: () => {
            offline.queue('locationLog', 'off', {
                id: shiftType.id
            }, context)
                .then(() => shiftType)
        },
        start: true
    })
}

exports.schedule = () => {
    logger.error('disabled')
    // db.shiftType.find()
    //     .then(shiftTypes =>
    //         bluebird.each(shiftTypes, shiftType => {
    //             let shiftEnd = moment(shiftType.endTime).get('hour')
    //             let shiftStart = moment(shiftType.startTime).get('hour') + 1
    //             start(shiftType, `* * ${shiftStart}-${shiftEnd}/1 * * *`)
    //         })
    //             .then(() => {
    //                 // console.log('missSwipe job has been scheduled');
    //                 logger.info(`location off job has been scheduled ${Date()}`)
    //             })
    //     ).catch(err => {
    //         throw err
    //     })
}
