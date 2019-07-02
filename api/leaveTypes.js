'use strict'
const mapper = require('../mappers/leaveType')
const db = require('../models')

const leaveTypeService = require('../services/leave-types')

exports.create = async (req) => {
    let entity = await leaveTypeService.create(req.body, req.context)
    return mapper.toModel(entity)
}

exports.search = async (req) => {
    let query = {
        organization: req.context.organization
    }
    let leaveTypes = await db.leaveType.find(query)
    return mapper.toSearchModel(leaveTypes)
}

exports.get = async (req) => {
    let entity = await leaveTypeService.get(req.params.id, req.context)
    return mapper.toModel(entity)
}

exports.delete = async (req) => {
    await leaveTypeService.delete(req.params.id, req.context)
    return 'deleted successfully'
}

exports.update = async (req) => {
    let entity = await leaveTypeService.update(req.params.id, req.body, req.context)
    return mapper.toModel(entity)
}
