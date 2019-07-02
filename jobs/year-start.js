'use strict'

const logger = require('@open-age/logger')('JOB year-start')
const cron = require('cron').CronJob
const offline = require('@open-age/offline-processor')

const contextBuilder = require('../helpers/context-builder')
const db = require('../models')
const moment = require('moment')

const start = async (orgCodes, date) => {
    date = date || new Date()
    let where = {
        //    status: 'active'
    }

    if (orgCodes && orgCodes.length) {
        let include = []
        let exclude = []

        orgCodes.forEach(element => {
            if (element.startsWith('^')) {
                exclude.push(element)
            } else {
                include.push(element)
            }
        })
        where.code = {
            $in: include,
            $nin: exclude
        }

        logger.info(`including orgs ${include.join()}`)
        logger.info(`excluding orgs ${exclude.join()}`)
    }

    let organizations = await db.organization.find(where)

    for (const organization of organizations) {
        let log = logger.start(`${organization.code}:${moment(date).format('YY-MM-DD')}`)
        let context = await contextBuilder.create({
            organization: organization
        }, log)
        if (!context.getConfig('jobs.year.start')) {
            continue
        }
        await offline.queue('work-year', 'start', { date: date }, context)
        log.end()
    }
}

exports.schedule = (orgCodes) => {
    let log = logger.start('schedule')
    new cron({
        cronTime: `00 00 01 01 01 *`,
        onTick: () => {
            start(orgCodes)
        },
        start: true
    })

    log.info(`scheduled: year start for all the organizations`)
}

exports.run = async (orgCodes, date) => {
    await start(orgCodes, date)
}
