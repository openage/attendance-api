'use strict'
let mapper = require('../mappers/deviceType')
let updationScheme = require('../helpers/updateEntities')
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
        category: model.category ? model.category.id : null,
        machine: model.machine ? model.machine.id : null
    }

    db.deviceType.findOrCreate(data, data)
        .then(device => {
            return res.data(mapper.toModel(device.result, req.context))
        })
        .catch(err => res.failure(err))
}

exports.update = (req, res) => {
    let model = req.body
    let deviceId = req.params.id

    db.deviceType.findById(deviceId)
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
        .then(device => res.data(mapper.toModel(device, req.context)))
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let query = {}
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
            db.deviceType.find(query)
                .populate('machine category')
                .then(devices => {
                    return res.page(mapper.toSearchModel(devices, req.context))
                })
        })
        .catch(err => res.failure(err))
}
