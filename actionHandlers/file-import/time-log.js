// this is mandatory file and must exist in all the actions
'use strict'
const fastCsv = require('fast-csv')
const fs = require('fs')
const timeLogs = require('../../services/time-logs')
const devices = require('../../services/devices')
const db = require('../../models')
const moment = require('moment')
const taskService = require('../../services/tasks')

const processOneByOne = async (models, device, context) => {
    let task = context.task
    task.progress = 2
    task.meta.count = models.length
    task.markModified('meta')
    await task.save()

    let count = 0

    for (const model of models) {
        try {
            let timeLog = await timeLogs.create(model, context)
            count++
            task.progress = 2 + Math.floor(98 * count / models.length)
            await task.save()

            await devices.log(device, 'Debug', `Processed time-log: '${timeLog.id}' employee:'${model.employee.code || model.employee.biometricCode}', time: '${model.time}', type: '${model.type || '--'}'.`, context)
        } catch (err) {
            task.meta.errors = task.meta.errors || []
            task.meta.errors.push({
                message: err.message || err,
                stack: err.stack,
                employee: model.employee.code || model.employee.biometricCode,
                time: model.time,
                type: model.type
            })

            task.markModified('meta')
            await task.save()

            devices.log(device, 'Error', `Error while saving time-log employee:'${model.employee.code || model.employee.biometricCode}', time: '${model.time}', type: '${model.type || '--'}'. Error: '${err}'`, context)
            context.logger.error(err)
        }
    }

    task.status = 'done'
    await task.save()
    // TODO: delete file
    await devices.log(device, 'Info', `${models.length} time-log(s) processed`, context)
}

// the default processing would be done here
exports.process = async (data, context) => {
    const device = await db.device.findById(data.device)

    if (device) {
        context.logger.context.device = {
            id: device.id
        }
    }

    let log = context.logger.start({
        location: data.filePath
    })

    if (device && device.type && device.type === 'master') {
        devices.log(device, 'Info', `Ignoring time logs, as this is 'master' device`, context)
        log.info(`ignoring records from ${device.id}`)
        return
    } else {
        devices.log(device, 'Debug', `Processing time logs from file: '${data.filePath}'`, context)
    }

    let task = context.task

    if (!task) {
        task = await taskService.create({
            entity: 'file-import',
            action: 'time-log',
            meta: data,
            assignedTo: 'processor',
            progress: 0,
            status: 'in-progress'
        }, context)

        context.task = task
    }

    let filePath = data.filePath

    log.debug(`taking data from file = ${filePath}`)

    var models = []
    return new Promise((resolve, reject) => {
        var csvStream = fastCsv.parse({
            headers: true
        }).on('data', row => {
            let timeString = row.time
            if (timeString.charAt(timeString.search('T') + 2) === ':') {
                timeString = timeString.replace('T', 'T0')
            }

            let type = row.type
            let isComputed = true

            let deviceLogType = device && device.type ? device.type : 'parse'
            if (deviceLogType) {
                switch (device.type) {
                case 'in':
                    type = 'checkIn'
                    isComputed = false
                    break
                case 'out':
                    type = 'checkOut'
                    isComputed = false
                    break
                case 'parse':
                    type = undefined
                    isComputed = true
                    break
                case 'both':
                    isComputed = !type
                    break
                default:
                    break
                }
            }

            let time = new Date(timeString)
            log.info(`biometricCode: '${row.code}' time: ${moment(time).format('HH:mm DD-MM-YYYY')}`)

            models.push({
                employee: { biometricCode: row.code },
                device: row.device || device,
                source: row.source || data.source,
                ipAddress: row.ipAddress || data.ipAddress,
                location: data.location,
                uploadedTime: data.uploadedTime,
                time: time,
                type: type,
                isComputed: isComputed,
                organization: context.organization
            })
        }).on('end', function () {
            log.info(`processing: '${models.length}' records`)

            processOneByOne(models, device, context).then(() => {
                log.end()
                resolve()
            }).catch(err => {
                log.error(err)
                log.end()
                resolve()
            })
        })
        fs.createReadStream(filePath).pipe(csvStream)
    })
}
