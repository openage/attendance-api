'use strict'
var attendances = require('../../services/attendances')

exports.process = async (timeLog, context) => {
    let log = context.logger.start(`id:${timeLog.id}`)

    try {
        await attendances.updateByTimeLog(timeLog, context)
    } catch (err) {
        log.error(err)
    }

    log.end()
}
