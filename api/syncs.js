'use strict'
const syncConfigurations = require('config').get('sync')

exports.getVersions = (req, res) => {
    let orgnaization = req.context.organization
    return res.json({
        isSuccess: true,
        data: {
            configVersion: orgnaization.devicesVersion || '',
            serviceVersion: syncConfigurations.serviceVersion
        }
    })
}
