const db = require('../models')
const categoryService = require('./categories')

const set = async (entity, model, context) => {
    if (model.category) {
        entity.category = await categoryService.get(model.category, context)
    }

    if (model.picUrl) {
        entity.picUrl = model.picUrl
    }

    if (model.picData) {
        entity.picData = model.picData
    }

    return entity
}

exports.create = async (model, context) => {
    if (!model.model) {
        throw new Error('model is required')
    }

    if (!model.manufacturer) {
        throw new Error('manufacturer is required')
    }

    if (!model.category) {
        throw new Error('category is required')
    }

    let data = {
        manufacturer: model.manufacturer,
        model: model.model

    }

    let machine = await exports.get(model, context)

    if (machine) {
        throw new Error('device already exist')
    }

    machine = new db.machine({
        manufacturer: data.manufacturer,
        model: data.model,
        tenant: context.tenant
    }, data)

    await set(machine, model, context)

    await machine.save()

    return machine
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(entity, model)
    await entity.save()
    return entity
}

exports.get = async (query, context) => {
    context.logger.silly('services/machines:get')
    let where = {
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.machine.findById(query)
        }
        where['code'] = query
        return db.machine.findOne(where)
    } else if (query.id) {
        return db.machine.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        return db.machine.findOne(where)
    }
}

exports.search = async (query, paging, context) => {
    let where = {
        tenant: context.tenant
    }
    let entities = await db.machine.find(where).populate('category')

    return {
        items: entities
    }
}
