'use strict'
const mapper = require('../mappers/shift')

const shiftService = require('../services/shifts')

exports.get = async (req) => {
    let entity = await shiftService.get(req.params.id, req.context)

    return mapper.toModel(entity, req.context)
}
