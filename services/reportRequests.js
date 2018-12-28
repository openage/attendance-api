'use strict'
const logger = require('@open-age/logger')('services.reportRequests')
const offline = require('@open-age/offline-processor')
const db = require('../models')

const create = async (model, context) => {
    const log = logger.start('create')
    var reportRequest = new db.reportRequests({
        type: model.type,
        provider: model.provider,
        requestedAt: new Date(),
        reportParams: JSON.stringify(model.reportParams),
        status: 'new',
        employee: context.employee,
        organization: context.organization
    })

    let report = await reportRequest.save()
    offline.queue('reportRequest', 'create', report, context)

    return report
}

exports.create = create

const search = async (query, skipCount, limitCount, context) => {
    const log = context.logger.start('search')

    let where = {
        organization: context.organization
    }
    if (query.type) {
        where.type = query.type
    }

    const count = await db.reportRequests.find(where).count()

    const items = await db.reportRequests.find(where).skip(skipCount).limit(limitCount).sort({ requestedAt: -1 })

    return {
        count: count,
        items: items
    }
}
exports.search = search

exports.get = async (query, context) => {
    let log = context.logger.start('services/reportRequests:get')
    let entity
    let where = {
        organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            entity = await db.reportRequests.findById(query)
        }
        where['code'] = query
        entity = await db.reportRequests.findOne(where)
    } else if (query.id) {
        entity = await db.reportRequests.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        entity = await db.reportRequests.findOne(where)
    }
    log.end()
    return entity
}
