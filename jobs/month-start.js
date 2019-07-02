'use strict'

const logger = require('@open-age/logger')('JOB month-start')
const cron = require('cron').CronJob
const offline = require('@open-age/offline-processor')
const contextBuilder = require('../helpers/context-builder')
const moment = require('moment')
const organizationService = require('../services/organizations')

const start = async (orgCodes, date) => {
    date = date || new Date()
    let organizations = await organizationService.getByCodes(orgCodes, { logger: logger })

    for (const organization of organizations) {
        let log = logger.start(`${organization.code}:${moment(date).format('YY-MM-DD')}`)
        let context = await contextBuilder.create({
            organization: organization
        }, log)

        if (!context.getConfig('jobs.month.start')) {
            continue
        }

        await offline.queue('work-month', 'start', {
            date: date
        }, context)
        log.end()
    }
}

exports.schedule = (orgCodes) => {
    let log = logger.start('schedule')
    new cron({
        cronTime: `00 00 01 01 * *`,
        onTick: () => {
            start(orgCodes)
        },
        start: true
    })
    log.info(`scheduled: month start for all the organizations`)
}

exports.run = async (orgCodes, date) => {
    await start(orgCodes, date)
}
