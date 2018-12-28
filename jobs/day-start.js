'use strict'

const logger = require('@open-age/logger')('JOB day-start')
const cron = require('cron').CronJob
const offline = require('@open-age/offline-processor')
const contextBuilder = require('../helpers/context-builder')
const db = require('../models')
const moment = require('moment')

const start = async (organizationCode, date) => {
    date = date || new Date()
    let where = {
        //    status: 'active'
    }

    if (organizationCode) {
        where.code = organizationCode
    }

    let organizations = await db.organization.find(where)

    for (const organization of organizations) {
        let log = logger.start(`${organization.code}:${moment(date).format('YY-MM-DD')}`)

        let context = await contextBuilder.create({
            organization: organization
        }, log)
        context.processSync = true
        await offline.queue('day', 'start', {
            date: date
        }, context)
        log.end()
    }
}

exports.schedule = () => {
    let log = logger.start('schedule')
    new cron({
        cronTime: `10 10 00 * * *`,
        onTick: () => {
            start()
        },
        start: true
    })
    log.info(`scheduled: day start for all the organizations`)
    log.end()
}

exports.run = async (organizationCode, date) => {
    await start(organizationCode, date)
}
