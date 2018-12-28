'use strict'
const formidable = require('formidable')
const appRoot = require('app-root-path')
const fs = require('fs')
const moment = require('moment')
const join = require('path').join
const async = require('async')
const mapper = require('../mappers/device')
const devices = require('../services/devices')
const _ = require('underscore')
const updationScheme = require('../helpers/updateEntities')
const logger = require('@open-age/logger')('api.devices')
const offline = require('@open-age/offline-processor')
const ip = require('../helpers/ip')
const db = require('../models')

let updateOrg = (device, org) => {
    org.devices.push(device.id)
    org.devicesVersion = org.devicesVersion ? (Number(org.devicesVersion) + 1).toString() : '1'
    return org.save()
}

exports.create = (req, res) => {
    let model = req.body

    if (!model.category || !model.machine) {
        return res.failure('category and machine is required')
    }

    let data = {
        name: model.name,
        ip: model.ip || '0.0.0.0',
        port: model.port,
        type: model.type,
        category: model.category ? model.category.id : null,
        machine: model.machine ? model.machine.id : null,
        location: model.location,
        serialNo: model.serialNo,
        bssid: model.bssid,
        // mute: model.mute,
        interval: model.interval,
        organization: req.context.organization
    }

    db.device.findOrCreate(data, data)
        .then(device => {
            return updateOrg(device.result, req.context.organization)
                .then(() => {
                    return device.result
                })
        }).then(device => {
            return res.data(mapper.toModel(device))
        })
        .catch(err => res.failure(err))
}

exports.update = (req, res) => {
    let model = req.body
    let deviceId = req.params.id

    db.device.findById(deviceId)
        .then(device => {
            if (model.category) {
                device.category = model.category.id
                delete model.category
            }
            if (model.machine) {
                device.machine = model.machine.id
                delete model.machine
            }

            updationScheme.update(model, device)
            return device.save()
        })
        .then((device) => {
            // updateOrg(device, req.context.organization)
            // .then(() => {
            res.data(mapper.toModel(device))
            // })
        })
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let organization = req.context.organization
    let query = {
        organization: organization
    }
    let populationMatcher = {}

    if (req.query.category) {
        populationMatcher = {
            category: {
                name: {
                    $regex: req.query.category,
                    $options: 'i'
                }
            }
        }
    }

    let getCategory = new Promise((resolve, reject) => {
        if (!req.query.category) {
            return resolve(null)
        }
        return db.category.findOne({
            name: {
                $regex: req.query.category,
                $options: 'i'
            }
        })
            .then(category => {
                query.category = category
                return resolve(null)
            })
            .catch(err => {
                reject(err)
            })
    })

    getCategory
        .then(() => {
            db.device.find(query)
                .populate('machine category')
                .then(devices => {
                    return res.page(mapper.toSearchModel(devices))
                })
        })
        .catch(err => res.failure(err))
}

exports.delete = (req, res) => {
    let deviceId = req.params.id
    let organizationDevices = req.context.organization.devices

    let device = _.find(organizationDevices, device => device.toString() === deviceId)

    organizationDevices.splice(organizationDevices.indexOf(device), 1)

    Promise.all([
        db.device.remove({
            _id: deviceId
        }),
        req.context.organization.save()
    ]).then(() => res.success('device successfully deleted')).catch(err => res.failure(err))
}

exports.get = (req, res) => {
    if (!req.params.id) {
        return res.failure('id required')
    }

    let query = {
        _id: req.params.id
    }

    db.device.findOne(query)
        .then(device => res.data(mapper.toModel(device)))
        .catch(err => {
            res.failure(err)
        })
}

exports.syncTimeLogs = (req, res) => {
    let log = logger.start('syncTimeLogs')

    var form = new formidable.IncomingForm()
    async.waterfall([cb => {
        var form = new formidable.IncomingForm()
        form.uploadDir = appRoot.path + '/temp'
        form.keepExtensions = true
        form.parse(req, (err, fields, files) => {
            if (err) {
                return cb(err)
            }
            if (files.file.name.substr(files.file.name.indexOf('.') + 1, files.file.name.length) !== 'csv') {
                return cb(new Error('only csv file is accepted'))
            }

            var csvFile = files.file
            let fileName = `${req.context.organization.code}-time-logs-${moment().format('YYYY-MM-DD-HH-mm-ss-ms')}.csv`.replace(/:/g, '-')
            let newPath = join(appRoot.path, 'temp', fileName)
            log.debug('csvFile', {
                path: newPath,
                size: csvFile.size,
                device: req.params.deviceId
            })
            fs.rename(csvFile.path, newPath, function (err, data) {
                if (err) {
                    return cb(err)
                }
                cb(null, newPath, csvFile.size)
            })
        })
    }, (filePath, size, cb) => {
        devices.log(req.params.deviceId, 'Debug', `received csv file - size: ${size}, name: ${filePath}`, req.context)
            .then(() => cb(null, filePath))
            .catch(err => cb(null, filePath))
    }, (filePath, cb) => {
        offline.queue('timeLog', 'file', {
            filePath: filePath,
            source: 'biometricDevice',
            uploadedTime: new Date(),
            device: req.params.deviceId,
            ipAddress: ip.getIpAddress(req)
        }, req.context).then(() => cb()).catch(err => cb(err))
    }], err => {
        if (err) {
            return devices.log(req.params.deviceId, 'Error', err, req.context)
                .then(() => res.failure(err))
                .catch(() => res.failure(err))
        }
        res.success('attendance will be updated soon')
    })
}
