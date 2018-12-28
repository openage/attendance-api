'use strict'
let cron = require('cron').CronJob
let db = global.db
var bluebird = require('bluebird')
var moment = require('moment')
const offline = require('@open-age/offline-processor')
const logger = require('@open-age/logger')('JOB shift-end')
const contextBuilder = require('../helpers/context-builder')

var start = async (shiftType, organization, date) => {
    date = date || new Date()
    let log = logger.start(`${organization.code}:${shiftType.code}:${moment(date).format('YY-MM-DD')}`)

    let context = await contextBuilder.create({
        organization: organization
    }, log)

    context.processSync = true
    await offline.queue('shift', 'end', {
        date: date,
        shiftType: shiftType
    }, context)

    log.end()
}

exports.schedule = () => {
    let log = logger.start('schedule')

    db.shiftType.find({}).populate('organization').then(shiftTypes => {
        bluebird.each(shiftTypes, shiftType => {
            if (!shiftType.organization || (shiftType.organization.config && shiftType.organization.config.skipShiftEnd)) {
                return
            }

            let startJobHour = moment(shiftType.endTime).get('hour')
            let startJobMin = moment(shiftType.endTime).get('minute')

            let job = new cron({
                cronTime: `00 ${startJobMin} ${startJobHour} * * *`,
                onTick: () => {
                    start(shiftType, shiftType.organization)
                },
                start: true
            })

            log.info(`scheduled: shift end for '${shiftType.code}' of '${shiftType.organization.code}'`)
        })
            .then(() => {
                log.end()
            })
    }).catch(err => {
        throw err
    })
}

exports.run = async (organizationCode, date) => {
    let where = {}

    if (organizationCode) {
        where.organization = await db.organization.findOne({ code: organizationCode })
    }

    let shiftTypes = await db.shiftType.find(where).populate('organization')
    for (const shiftType of shiftTypes) {
        if (!shiftType.organization || (shiftType.organization.config && shiftType.organization.config.skipShiftCreate)) {
            return
        }
        await start(shiftType, shiftType.organization, date)
    }
}
