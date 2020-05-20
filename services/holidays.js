'use strict'
const offline = require('@open-age/offline-processor')
const db = require('../models')

const dates = require('../helpers/dates')

let set = async (entity, model, context) => {
    if (model.date && !dates.date(entity.date).isSame(model.date)) {
        let date = dates.date(model.date).bod()

        let existing = await this.get({ date: date }, context)

        if (existing && existing.id !== entity.id) {
            throw new Error(`This date already alloted to ${existing.name}`)
        }

        entity.date = model.date
    }

    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.departments) {
        entity.departments = model.departments
    }

    if (model.divisions) {
        entity.divisions = model.divisions
    }

    return entity
}

exports.create = async (model, context) => {
    if (!model.date) {
        throw new Error('date is required')
    }

    if (!model.name) {
        throw new Error('name is required')
    }

    let entity = new db.holiday({
        status: 'active',
        organization: context.organization,
        tenant: context.tenant
    })

    await set(entity, model, context)

    await entity.save()

    await offline.queue('holiday', 'create', entity, context)

    return entity
}

exports.search = async (query, paging, context) => {
    context.logger.start('search')

    let sorting = ''
    if (paging && paging.sort) {
        sorting = paging.sort
    }

    let sort = {}

    switch (sorting) {
        default:
            sort['date'] = 1
            break
    }

    query = query || {}

    let where = {
        status: 'active',
        organization: context.organization
    }

    if (query.name) {
        where.name = {
            '$regex': `^${query.name}`,
            '$options': 'i'
        }
    }

    if (query.timeStamp) {
        where.timeStamp = {
            $gte: Date.parse(query.timeStamp)
        }
    }

    if (query.date) {
        where.date = dates.date(query.date).bod()
    }

    let from
    let till

    if (query.from) {
        from = dates.date(query.from).bod()
    }

    if (query.year) {
        from = dates.date(query.year).boy()
        till = dates.date(query.year).eoy()
        sort['date'] = 1
    }

    if (query.current) {
        from = dates.date(new Date()).bod()
        sort['date'] = -1
    }

    if (query.past) {
        till = dates.date(new Date()).bod()
        sort['date'] = -1
    }

    if (from) {
        where.date = where.date || {}
        where.date['$gte'] = from
    }
    if (till) {
        where.date = where.date || {}
        where.date['$lte'] = till
    }

    const count = await db.holiday.find(where).count()
    let items
    if (paging) {
        items = await db.holiday.find(where).sort(sort).skip(paging.skip).limit(paging.limit)
    } else {
        items = await db.holiday.find(where).sort(sort)
    }

    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    context.logger.silly('services/holidays:get')
    let where = {
        organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.holiday.findById(query)
        }
        where['code'] = query.toLowerCase()
        return db.holiday.findOne(where)
    } else if (query.id) {
        return db.holiday.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        return db.holiday.findOne(where)
    } else if (query.date) {
        where['date'] = dates.date(query.date).bod()
        return db.holiday.findOne(where)
    }
}

exports.remove = async (id, context) => {
    let entity = await this.get(id, context)

    entity.status = 'inactive'

    await entity.save()

    await offline.queue('holiday', 'delete', entity, context)
}

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)

    await set(entity, model, context)

    await entity.save()

    await offline.queue('holiday', 'update', entity, context)

    return entity
}
