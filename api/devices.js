'use strict'
const formidable = require('formidable')
const appRoot = require('app-root-path')
const fs = require('fs')
const moment = require('moment')
const join = require('path').join
const offline = require('@open-age/offline-processor')
const ip = require('../helpers/ip')
const deviceService = require('../services/devices')
const api = require('./api-base')('devices', 'device')

api.setLastSyncTime = async (req) => {
    let deviceId
    if (req.body.device) {
        deviceId = req.body.device
    } else if (req.params.id) {
        deviceId = req.params.id
    }

    await deviceService.setLastSyncTime(deviceId, req.body.date, req.context)
    return 'Done'
}

api.setStatus = async (req) => {
    let deviceId = req.params.id

    switch (req.body.status) {
        case 'online':
            await deviceService.setOnline(deviceId, req.context)
            break

        case 'offline':
            await deviceService.setOffline(deviceId, req.context)
            break
    }

    return 'done'
}

let getFiles = (req) => {
    return new Promise((resolve, reject) => {
        var form = new formidable.IncomingForm()
        form.uploadDir = appRoot.path + '/temp'
        form.keepExtensions = true

        form.parse(req, (err, fields, files) => {
            if (err) {
                return reject(err)
            }

            resolve(files)
        })
    })
}

api.syncTimeLogs = async (req) => {
    let files = await getFiles(req)

    if (files.file.name.substr(files.file.name.indexOf('.') + 1, files.file.name.length) !== 'csv') {
        throw new Error('only csv file is accepted')
    }

    let csvFile = files.file
    let fileName = `${req.context.organization.code}-time-logs-${moment().format('YYYY-MM-DD-HH-mm-ss-ms')}.csv`.replace(/:/g, '-')
    let newPath = join(appRoot.path, 'temp', fileName)
    req.context.logger.debug('received csv file', {
        path: newPath,
        size: csvFile.size,
        device: req.params.deviceId
    })
    fs.renameSync(csvFile.path, newPath)

    await offline.queue('file-import', 'time-log', {
        filePath: newPath,
        source: 'biometricDevice',
        uploadedTime: new Date(),
        device: req.params.deviceId,
        ipAddress: ip.getIpAddress(req)
    }, req.context)

    return 'attendance will be updated soon'
}

module.exports = api
