'use strict'
let cron = require('cron').CronJob
let db = global.db
var moment = require('moment')
const offline = require('@open-age/offline-processor')
const logger = require('@open-age/logger')('JOB shift-end')
const contextBuilder = require('../helpers/context-builder')

const shiftService = require('../services/shifts')
const organizationService = require('../services/organizations')

var start = async (shiftTypeId, organizationId, date) => {
    let context = await contextBuilder.create({
        organization: {
            id: organizationId
        }
    }, logger)

    if (!context.getConfig('jobs.shift.end')) {
        return
    }

    context.logger.context.shiftType = shiftTypeId

    date = date || new Date()
    let log = logger.start(moment(date).format('YYYY-MM-DD'))

    const shift = await shiftService.get({
        shiftType: {
            id: shiftTypeId
        },
        date: date
    }, context)

    await offline.queue('shift', 'end', shift, context)
    log.end()
}

const getSchedule = async (orgCodes, log) => {
    const schedule = []

    let organizations = await organizationService.getByCodes(orgCodes, { logger: logger })

    for (const organization of organizations) {
        let shiftTypes = await db.shiftType.find({
            organization: organization
        })

        for (const shiftType of shiftTypes) {
            let startJobHour = moment(shiftType.endTime).get('hour')
            let startJobMin = moment(shiftType.endTime).get('minute')

            schedule.push({
                cronTime: `00 ${startJobMin} ${startJobHour} * * *`,
                shiftTypeId: shiftType.id,
                organizationId: organization.id
            })
            log.info('scheduling', {
                shiftType: shiftType.id
            })
        }
    }

    return schedule
}

exports.schedule = (orgCodes) => {
    let log = logger.start('schedule')

    getSchedule(orgCodes, log).then(schedule => {
        for (const item of schedule) {
            let job = new cron({
                cronTime: item.cronTime,
                onTick: () => {
                    start(item.shiftTypeId, item.organizationId)
                },
                start: true
            })
        }
        log.info(`scheduled ${schedule.length} shift(s)`)
    }).catch(err => {
        log.error(err)
    })
}

exports.run = async (orgCodes, date) => {
    let log = logger.start('run')

    let schedule = await getSchedule(orgCodes, log)
    for (const item of schedule) {
        await start(item.shiftTypeId, item.organizationId, date)
    }
    log.end()
}
