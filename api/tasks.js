'use strict'

const service = require('../services/tasks')
const mapper = require('../mappers/task')

const offline = require('@open-age/offline-processor')
const pager = require('../helpers/paging')

exports.create = async (req) => {
    const task = await service.create(req.body, req.context)
    return mapper.toModel(task, req.context)
}

exports.run = async (req) => {
    const task = await service.get(req.params.id, req.context)
    // if ('new|error'.indexOf(task.status) === -1) {
    //     throw new Error(`cannot run a task in state '${task.status}'`)
    // }

    // if ('job|processor'.indexOf(task.assignedTo) === -1) {
    //     throw new Error(`cannot run a task of type '${task.assignedTo}'`)
    // }

    task.status = 'queued'
    await task.save()
    await offline.queue('task', 'run', task, req.context)
    return 'queued'
}

exports.get = async (req) => {
    const task = await service.get(req.params.id, req.context)

    return mapper.toModel(task, req.context)
}

exports.search = async (req) => {
    const query = {}

    if (req.query.biometricId) {
        query.data = req.query.biometricId
    }

    if (req.query.biometricIds) {
        query.data = {
            $in: req.query.biometricIds.split(',')
        }
    }

    if (!req.query.status) {
        query.status = 'new'
    } else if (req.query.status !== 'any') {
        query.status = req.query.status
    }

    if (req.query.deviceId !== 'any') {
        if (req.query.device) {
            query.device = req.query.device
        } else if (req.query.deviceId) {
            query.device = req.query.deviceId
        } else {
            query.device = null
        }
    }

    if (!req.query.assignedTo) {
        query.assignedTo = 'sync-service'
    } else if (req.query.assignedTo !== 'any') {
        query.assignedTo = req.query.assignedTo
    }

    if (req.query.from) {
        query.date = {
            $gte: req.query.from
        }
    }

    let paging = pager.extract(req)
    const result = await service.search(query, paging, req.context)

    let page = {
        items: mapper.toSearchModel(result.items),
        total: result.count
    }

    if (paging) {
        page.pageNo = paging.pageNo
        page.pageSize = paging.limit
    }

    return page
}

exports.update = async (req) => {
    const task = await service.update(req.params.id, req.body, req.context)

    return mapper.toModel(task, req.context)
}
