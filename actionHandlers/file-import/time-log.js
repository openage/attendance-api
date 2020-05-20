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
    let log = context.logger.start(`Count:${(models || []).length}`, { device: device.id })
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

            log.debug(`Processed 
                progress: '${task.progress}',
                time-log: '${timeLog.id}', 
                user-code:'${model.employee.code}', 
                biometric-code: '${model.employee.biometricCode}',
                time: '${model.time}', 
                type: '${model.type || '--'}'.`)
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

            log.error(`Error while processing 
                user-code:'${model.employee.code}', 
                biometric-code: '${model.employee.biometricCode}',
                time: '${model.time}', 
                type: '${model.type || '--'}'.`, err)
        }
    }

    task.status = 'done'
    await task.save()
    log.end()
    // TODO: delete file
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
        location: data.filePath,
        device: device.id
    })

    if (device && device.type && device.type === 'master') {
        log.info(`ignoring records from ${device.id}`)
        return
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
