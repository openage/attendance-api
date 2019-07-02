'use strict'
const db = require('../models')

const set = (model, entity, context) => {
    if (model.title) {
        entity.title = model.title
    }

    if (model.config.trigger) {
        entity.config.trigger = model.config.trigger
    }

    if (model.config.processor) {
        entity.config.processor = model.config.processor
    }

    if (model.type) {
        entity.type = model.type
    }

    if (model.status) {
        entity.status = model.status
    }
}

exports.create = async (model, context) => {
    context.logger.start('services:create')
    return new db.insight(model).save()
}

exports.search = async (query, context) => {
    context.logger.start('search')
    query.organization = context.organization.id
    return db.insight.find(query).populate('employee type')
}

exports.get = async (id, context) => {
    context.logger.start('get')
    return db.insight.findById(id)
}

exports.update = async (id, model, context) => {
    context.logger.start('update')
    let entity = await db.insight.findById(id)
    set(model, entity, context)
    return entity.save()
}
