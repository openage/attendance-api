'use strict'

const logger = require('@open-age/logger')('api/tasks')
const service = require('../services/tasks')
const mapper = require('../mappers/task')

exports.create = async (req, res) => {
    const log = logger.start('create')

    const task = await service.create(req.body, req.context)

    return res.data(mapper.toModel(task))
}

exports.get = async (req, res) => {
    const log = logger.start('get')

    const task = await service.get(req.params.id, req.context)

    return res.data(mapper.toModel(task))
}

exports.search = async (req, res) => {
    const log = logger.start('search')

    const query = {
        status: 'new'
    }

    if (req.query.device) {
        query.device = req.query.device
    }

    if (req.query.from) {
        query.date = {
            $gte: req.query.from
        }
    }

    const tasks = await service.search(query, req.context)

    return res.page(mapper.toSearchModel(tasks))
}

exports.update = async (req, res) => {
    const log = logger.start('update')

    const task = await service.update(req.params.id, req.body, req.context)

    return res.data(mapper.toModel(task))
}
