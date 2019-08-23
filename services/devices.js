'use strict'
const db = require('../models')

const taskService = require('./tasks')
const categoryService = require('./categories')

const offline = require('@open-age/offline-processor')

const set = async (entity, model, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.ip && model.port && (model.ip !== entity.ip || model.port !== entity.port)) {
        let existing = await exports.get({ ip: model.ip, port: model.port }, context)

        if (existing) {
            throw new Error(`${model.ip}:${model.port} already exists`)
        }
        entity.ip = model.ip
        entity.port = model.port
    }

    if (model.type) {
        entity.type = model.type
    }

    if (model.category) {
        entity.category = await categoryService.get(model.category, context)
    }

    if (model.machine) {
        entity.machine = model.machine
    }

    if (model.location) {
        entity.location = model.location
    }

    if (model.serialNo) {
        entity.serialNo = model.serialNo
    }

    if (model.bssid) {
        entity.bssid = model.bssid
    }

    if (model.mute !== undefined) {
        entity.mute = model.mute
    }

    if (model.interval !== undefined) {
        entity.interval = model.interval
    }

    return entity
}

exports.log = async (deviceId, level, message, context) => {
    if (!deviceId) {
        return
    }
    let id = deviceId.id || deviceId

    try {
        const device = await db.device.findById(id)
        if (!device) {
            context.logger.error(`could not log ${level} message ${message}, reason: device with id: ${deviceId} not found`)
            return
        }
        return new db.deviceLog({
            status: level,
            description: message,
            device: device
        }).save()
    } catch (err) {
        context.logger.error(`could not log ${level} message ${message} to device ${deviceId}`, err)
    }
}

exports.setOnline = async (device, context) => {
    let id = device.id || device

    let log = context.logger.start({ location: 'setOnline', device: id })

    device = await db.device.findById(id)

    if (device.status === 'disabled') {
        let error = 'DEVICE_DISABLED'
        log.error(error)
        throw new Error(error)
    }
    if (device.status === 'offline') {
        log.info('device is now back')
    }
    device.status = 'online'
    device.lastSeen = new Date()
    return device.save()
}

exports.setOffline = async (device, context) => {
    let id = device.id || device

    let log = context.logger.start({ location: 'setOnline', device: id })

    device = await db.device.findById(id)

    if (device.status === 'disabled') {
        let error = 'DEVICE_DISABLED'
        log.error(error)
        throw new Error(error)
    }

    if (device.status === 'online') {
        log.error('DEVICE_OFFLINE')
    }

    device.status = 'offline'
    return device.save()
}

exports.setLastSyncTime = async (id, date, context) => {
    let task = {
        data: date,
        device: {
            id: id
        },
        entity: 'config',
        action: 'setLastSyncTime',
        assignedTo: 'sync-service'
    }

    await taskService.create(task, context)
}

exports.create = async (model, context) => {
    if (!model.machine) {
        throw new Error(' machine is required')
    }

    let device = await exports.get(model, context)

    if (device) {
        throw new Error('device already exist')
    }

    device = new db.device({
        name: model.name,
        ip: model.ip || '0.0.0.0',
        port: model.port || '0',
        organization: context.organization,
        tenant: context.tenant
    })

    await set(device, model)
    await device.save()
    await offline.queue('device', 'create', device, context)
    return device
}

exports.update = async (id, model, context) => {
    let device = await exports.get(id, context)
    await set(device, model)
    await device.save()
    await offline.queue('device', 'update', device, context)
    return device
}

exports.get = async (query, context) => {
    context.logger.silly('services/devices:get')
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.device.findById(query)
        }
        where['name'] = query
        return db.device.findOne(where)
    } else if (query.id) {
        return db.device.findById(query.id)
    } else if (query.name) {
        where['name'] = query.name
        return db.device.findOne(where)
    } else if (query.ip && query.port) {
        where['ip'] = query.ip
        where['port'] = query.port
        return db.device.findOne(where)
    }
}

exports.remove = async (deviceId, context) => {
    await db.device.remove({
        _id: deviceId,
        organization: context.organization
    })
}

exports.search = async (query, paging, context) => {
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (query.category) {
        where.category = await db.category.findOne({
            name: {
                $regex: query.category,
                $options: 'i'
            },
            tenant: context.tenant
        })
    }

    let entities = await db.device.find(where).populate('machine category')
    return { items: entities }
}
