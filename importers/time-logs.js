'use strict'
const offline = require('@open-age/offline-processor')

exports.run = function (req) {
    if (!req.file) {
        throw new Error('file is required')
    }

    return actionHandler.queue('timeLog', 'file', {
        filePath: req.file
    }, req.context)
}
