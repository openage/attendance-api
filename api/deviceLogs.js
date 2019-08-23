'use strict'
const devices = require('../services/devices')

exports.create = async (req) => {
    await devices.log(req.body.deviceId, req.body.status, req.body.description, req.context)
}
