'use strict'
global.Promise = require('bluebird')
global.processSync = true
process.env.APP = 'cron'

const fs = require('fs')
const logger = require('@open-age/logger')('cron')

require('../helpers/string')
require('../helpers/number')
require('../helpers/toObjectId')
require('../helpers/period')
require('../settings/database').configure(logger)
require('../settings/offline-processor').configure(logger)

const appRoot = require('app-root-path')

fs.readdirSync(`${appRoot}/jobs`).forEach(file => {
    if (file.indexOf('.js') <= 0) {
        logger.error(`${file} is not a js file`)
        return
    }
    let fileName = file.substring(0, file.indexOf('.js'))

    var schedule = require(`${appRoot}/jobs/${file}`).schedule

    if (!schedule) {
        logger.info(`${file} does not have a schedule method`)
        return
    }

    let orgCodes = process.env.ORG_CODES ? process.env.ORG_CODES.split(',') : null

    if (!process.env.CRON_NAME) {
        return schedule(orgCodes)
    }

    if (process.env.CRON_NAME !== fileName.toLowerCase()) {
        return
    }
    logger.info(`scheduling ${file}`)
    return schedule(orgCodes)
})
