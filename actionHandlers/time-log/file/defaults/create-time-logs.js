// this is mandatory file and must exist in all the actions
'use strict'
const logger = require('@open-age/logger')('handlers.timeLog.file.defaults.create-time-logs')
const fastCsv = require('fast-csv')
const fs = require('fs')
const employees = require('../../../../services/employees')
const timeLogs = require('../../../../services/time-logs')
const devices = require('../../../../services/devices')
const async = require('async')
const db = require('../../../../models')

// the default processing would be done here
exports.process = async (data, context, next) => {
    const device = await db.device.findById(data.device)

    if (device && device.type && device.type === 'master') {
        devices.log(device, 'Info', `Ignoring time logs, as this is 'master' device`)
        logger.info(`ignoring records from ${device.id}`)
        return next()
    } else {
        devices.log(device, 'Debug', `Processing time logs from file: '${data.filePath}'`)
    }

    let logType
    if (device && device.type && device.type === 'in') {
        logType = 'checkIn'
    }

    if (device && device.type && device.type === 'out') {
        logType = 'checkOut'
    }

    let filePath = data.filePath

    logger.info(`taking data from file = ${filePath}`)

    var models = []
    var csvStream = fastCsv.parse({
        headers: true
    }).on('data', row => {
        let timeString = row.time
        if (timeString.charAt(timeString.search('T') + 2) === ':') {
            timeString = timeString.replace('T', 'T0')
        }

        let type = row.type || logType
        models.push({
            employee: { code: row.code },
            device: row.device || data.device || device,
            source: row.source || data.source,
            ipAddress: row.ipAddress || data.ipAddress,
            location: data.location,
            uploadedTime: data.uploadedTime,
            time: new Date(timeString),
            type: type,
            isComputed: !type,
            organization: context.organization
        })
    }).on('end', function () {
        let progress = 0
        let workSize = models.length + 10
        async.eachSeries(models, (model, cb) => {
            progress++
            if (context.onProgress) {
                context.onProgress(progress, workSize)
            }

            timeLogs.create(model, context)
                .then(() => {
                    devices.log(device, 'Debug', `Processed time-log employee:'${model.employee.code}', time: '${model.time}', type: '${model.type || '--'}'.`)
                    cb(null)
                })
                .catch(err => {
                    devices.log(device, 'Error', `Error while saving time-log employee:'${model.employee.code}', time: '${model.time}', type: '${model.type || '--'}'. Error: '${err}'`)
                    logger.error(err)
                    cb(null)
                })
        }, (err) => {
            if (err) {
                logger.error(err)
                return next(err)
            }
            // TODO: delete file
            devices.log(device, 'Info', `${models.length} time-log(s) processed`)
            next(null, `${models.length} log(s) processed`)
        })
    })
    fs.createReadStream(filePath).pipe(csvStream)
}
