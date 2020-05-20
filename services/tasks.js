'use strict'

const db = require('../models')

const set = (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.message && entity.status === 'error') {
        entity.error = model.message
    }
}

const create = async (model, context) => {
    context.logger.start('create')

    var task = new db.task({
        data: model.data,
        entity: model.entity,
        action: model.action,
        progress: model.progress || 0,
        assignedTo: model.assignedTo,
        date: model.date || new Date(),
        employee: model.employee,
        device: model.device,
        meta: model.meta,
        organization: context.organization,
        status: model.status || 'new'
    })

    return task.save()
}

const get = async (query, context) => {
    context.logger.debug('services/tasks:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.task.findById(query)
    }
    if (query.id) {
        return db.task.findById(query.id)
    }

    return null
}

const search = async (query, paging, context) => {
    context.logger.start('search')
    query.organization = context.organization

    const count = await db.task.find(query).count()

    var items = []

    if (paging) {
        items = await db.task.find(query).skip(paging.skip).limit(paging.limit)
    } else {
        items = await db.task.find(query)
    }

    return {
        count: count,
        items: items
    }
}

const update = async (id, model, context) => {
    context.logger.silly('update')

    let entity = await db.task.findById(id)
    set(model, entity, context)
    return entity.save()
}

exports.get = get
exports.create = create
exports.search = search
exports.update = update
