'use strict'

exports.create = async (req) => {
    let level = req.body.status || 'info'

    switch (level) {
        case 'debug':
            level = 'debug'
            break
        case 'info':
            level = 'info'
            break
        case 'error':
            level = 'error'
            break
        default:
            level = 'info'
            break
    }

    req.context.logger[level](req.body.description, { device: req.body.deviceId || req.body.device })

    return 'done'
}
