const db = require('../models')
const categoryService = require('./categories')

const set = async (entity, model, context) => {
    if (model.code && entity.code !== model.code) {
        let entity = await this.get(model.code, context)

        if (entity) {
            throw new Error(`code '${model.code}' already exists`)
        }

        entity.code = model.code.toLowerCase()
    }

    if (model.manufacturer) {
        entity.manufacturer = model.manufacturer
    }

    if (model.model) {
        entity.model = model.model
    }

    if (model.category) {
        entity.category = await categoryService.get(model.category, context)
    }

    if (model.pic) {
        entity.pic = {
            url: model.pic.url,
            thumbnail: model.pic.thumbnail
        }
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

    let entity = await exports.get(model, context)

    if (entity) {
        throw new Error('device already exist')
    }

    entity = new db.machine({
        tenant: context.tenant
    })

    await set(entity, model, context)
    await entity.save()
    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(entity, model, context)
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
        where['code'] = query.toLowerCase()
        return db.machine.findOne(where)
    } else if (query.id) {
        return db.machine.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
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
