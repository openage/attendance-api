'use strict'

exports.create = async (model, context) => {
    const log = context.logger.start('services:create')

    return await new db.insightType(model).save()
}

exports.search = async (query, context) => {
    const log = context.logger.start('search')

    return await db.insightType.find(query)
}

exports.get = async (id, context) => {
    const log = context.logger.start('get')

    return await db.insightType.findById(id)
}
