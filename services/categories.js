const db = require('../models')

exports.create = async (model, context) => {
    if (!model.name) {
        throw new Error('name is required')
    }

    let entity = exports.get(model.name, context)

    if (entity) { return entity }

    entity = new db.category({
        name: model.name,
        tenant: model.tenant
    })

    await entity.save()

    return entity
}

exports.get = async (query, context) => {
    context.logger.silly('services/categories:get')
    let where = {
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.category.findById(query)
        }
        where['name'] = { $regex: query, $options: 'i' }
        return db.category.findOne(where)
    } else if (query.id) {
        return db.category.findById(query.id)
    } else if (query.name) {
        where['name'] = { $regex: query.name, $options: 'i' }
        return db.category.findOne(where)
    }
}

exports.search = async (query, paging, context) => {
    let where = {
        tenant: context.tenant
    }
    let entities = await db.category.find(where).populate({ path: 'machines', match: { status: { $ne: 'inactive' } } })

    return {
        items: entities
    }
}
