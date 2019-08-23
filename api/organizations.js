'use strict'
const mapper = require('../mappers/organization')
const organizationService = require('../services/organizations')

exports.update = async (req) => {
    let entity = await organizationService.update(req.params.id, req.model, req.context)
    return mapper.toModel(entity, req.context)
}

exports.get = async (req) => {
    let entity = await organizationService.get(req.params.id, req.context)
    return mapper.toModel(entity, req.context)
}
