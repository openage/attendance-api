'use strict'
const pager = require('../helpers/paging')
module.exports = (serviceName, mapperName) => {
    let name = serviceName
    const entityService = require('../services')[name]
    const entityMapper = require('../mappers')[mapperName || name]
    return {
        get: async (req) => {
            if (!entityService.get) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            let entity = await entityService.get(req.params.id, req.context)
            return entityMapper.toModel(entity, req.context)
        },
        search: async (req) => {
            if (!entityService.search) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            let page = pager.extract(req)

            const entities = await entityService.search(req.query, page, req.context)

            let pagedItems = {
                items: entities.items.map(i => { return (entityMapper.toSummary || entityMapper.toModel)(i, req.context) }),
                total: entities.count || entities.items.length
            }

            if (page) {
                pagedItems.skip = page.skip
                pagedItems.limit = page.limit
                pagedItems.pageNo = page.pageNo
            }

            return pagedItems
        },
        update: async (req) => {
            if (!entityService.update) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            const entity = await entityService.update(req.params.id, req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },

        create: async (req) => {
            if (!entityService.create) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            const entity = await entityService.create(req.body, req.context)
            return entityMapper.toModel(entity, req.context)
        },
        delete: async (req) => {
            if (!entityService.remove) {
                throw new Error(`METHOD_NOT_SUPPORTED`)
            }
            if (!entityService.remove) {
                throw new Error(`remove is not supported`)
            }
            await entityService.remove(req.params.id, req.context)

            return 'Removed'
        }
    }
}
