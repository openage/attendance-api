'use strict'

const logger = require('@open-age/logger')('JOB year-start')
const cron = require('cron').CronJob
const offline = require('@open-age/offline-processor')

const contextBuilder = require('../helpers/context-builder')
const db = require('../models')
const moment = require('moment')

const start = async (organizationCode, date) => {
    date = date || new Date()
    let organizations = await db.organization.find({})

    for (const organization of organizations) {
        let log = logger.start(`${organization.code}:${moment(date).format('YY-MM-DD')}`)
        let context = await contextBuilder.create({
            organization: organization
        }, log)
        context.processSync = true
        await offline.queue('work-year', 'start', {}, context)
        log.end()
    }
}

exports.schedule = () => {
    let log = logger.start('schedule')
    new cron({
        cronTime: `00 00 01 01 01 *`,
        onTick: () => {
            start()
        },
        start: true
    })

    log.info(`scheduled: year start for all the organizations`)
}

exports.run = async (organizationCode, date) => {
    await start(organizationCode, date)
}
