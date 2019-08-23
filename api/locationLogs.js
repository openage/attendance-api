const mapper = require('../mappers/locatinLog')
const service = require('../services/location-logs')

exports.create = async (req) => {
    let entity = await service.create(req.body, req.context)
    return mapper.toModel(entity, req.context)
}

exports.search = async (req) => {
    let page = await service.search(req.query, null, req.context)

    return {
        items: page.items.map(i => mapper.toModel(i, req.context))
    }
}
