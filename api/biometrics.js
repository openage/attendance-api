'use strict'

const service = require('../services/biometrics')
const employeeService = require('../services/employee-getter')
const mapper = require('../mappers/biometric')
const db = require('../models')

exports.create = async (req) => {
    const entity = await service.create(req.body, req.context)
    return mapper.toModel(entity)
}

exports.get = async (req) => {
    const entity = await service.get(req.params.id, req.context)
    return mapper.toModel(entity)
}

exports.search = async (req) => {
    const entities = await service.search(req.query, req.context)
    return entities.map(item => {
        let model = mapper.toModel(item)
        model.marks = undefined
        return model
    })
}

exports.update = async (req, res) => {
    const entity = await service.update(req.params.id, req.body, req.context)
    return mapper.toModel(entity)
}

exports.bulk = async (req) => {
    let updated = 0
    let created = 0
    for (const item of req.body.items) {
        let device
        if (item.deviceName) {
            device = await db.device.findOne({
                name: item.deviceName
            }).populate('machine')
        }

        if (!device) {
            throw new Error(`Device '${item.deviceName}' does not exist`)
        }

        let user = await employeeService.get({
            code: item.employeeCode
        }, req.context)

        if (!user) {
            throw new Error(`User with code '${item.deviceName}' does not exist`)
        }

        let biometric = await service.get({
            user: user,
            device: device
        }, req.context)

        if (item.status) {
            if (item.status === ('enable' || 'enabled' || 'Enable' || 'Enabled')) {
                item.status = 'enabled'
            } else if (item.status === ('fetch' || 'Fetch' || 'fetched' || 'Fetched')) {
                item.status = 'fetching'
            } else if (item.status === ('disable' || 'Disable')) {
                item.status = 'disabled'
            } else if (item.status === ('delete' || 'Delete')) {
                item.status = 'deleted'
            } else {
                item.status = item.status.toLowerCase()
            }
        }
        item.device = device
        item.user = user

        if (!biometric) {
            await service.create(item, req.context)
            created++
        } else {
            await service.update(biometric.id, item, req.context)
            updated++
        }
    }

    return `added: '${created}' updated: '${updated}' biometics `
}
