'use strict'
exports.getIpAddress = (req) => {
    if (req.headers['x-forwarded-for']) {
        return req.headers['x-forwarded-for'].split(',')[0]
    } else if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress
    } else {
        return req.ip
    }
}
