'use strict'

const logger = require('@open-age/logger')('services/tasks')
const db = require('../models')

const set = (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }
}

const create = (model, context) => {
    const log = logger.start('create')

    if (!model.organization) {
        model.organization = context.organization
    }

    var task = new db.task({
        date: model.date,
        employee: model.employee,
        action: model.action,
        device: model.device,
        organization: model.organization,
        status: model.status
    })

    return task.save()
}

const get = (id, context) => {
    const log = logger.start('get')

    return db.task.findById(id)
}

const search = async (query, context) => {
    const log = logger.start('query')
    query.organization = context.organization

    const items = await db.task.find(query)

    return items
}

const update = async (id, model, context) => {
    const log = logger.start('update')

    let entity = await db.task.findById(id)
    set(model, entity, context)
    return entity.save()
}

exports.get = get
exports.create = create
exports.search = search
exports.update = update
