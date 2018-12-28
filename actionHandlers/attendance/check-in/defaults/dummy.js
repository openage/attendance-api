// this is mandatory file and must exist in all the actions
'use strict'
const logger = require('@open-age/logger')('handlers.attendance.check-in.defaults.dummy')

// the default processing would be done here
exports.process = function (data, context, cb) {
    // TODO: add default processing here
    logger.info('no-further action - fix me')
    // TODO: if supervisor of employee does not exist - approve it (use api to do this)

    cb()
}
