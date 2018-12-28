// this is mandatory file and must exist in all the actions
'use strict'
const logger = require('@open-age/logger')('handlers.leave.submit')

// the default processing would be done here
exports.process = function (data, context, cb) {
    // TODO: add default processing here

    // TODO: if supervisor of employee does not exist - approve it (use api to do this)

    cb()
}
