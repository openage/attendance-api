'use strict'
const mapper = require('../mappers/shiftType')
const shiftTypes = require('../services/shift-types')
const offline = require('@open-age/offline-processor')
const db = require('../models')

exports.create = async (req) => {
    let shiftType = await shiftTypes.create(req.body, req.context)
    return mapper.toModel(shiftType, req.context)
}

exports.update = async (req) => {
    let shiftType = await shiftTypes.update(req.params.id, req.body, req.context)
    return mapper.toModel(shiftType, req.context)
}

exports.search = async (req, res) => {
    let shiftTypeList = await shiftTypes.search(req.query, req.context)
    return {
        items: mapper.toSearchModel(shiftTypeList, req.context)
    }
}

exports.get = async (req) => {
    let shiftType = await db.shiftType.findOne({
        _id: req.params.id
    }).lean()

    return mapper.toModel(shiftType, req.context)
}

exports.getByDate = async (req) => {
    if (!req.query.date) {
        throw new Error('date is required')
    }

    if (!req.query.employee) {
        throw new Error('employee is required')
    }

    let shiftType = await shiftTypes.getByDate(req.query.date, req.query.employee, req.context)
    return mapper.toModel(shiftType, req.context)
}

exports.delete = async (req) => {
    let shiftType = await db.shiftType.findById(req.params.id)

    if (shiftType.code.toLowerCase() === 'gen') {
        throw new Error('general shift can not be deletd')
    }

    await db.shiftType.findByIdAndUpdate({
        _id: req.params.id
    }, {
        $set: {
            status: 'inactive'
        }
    })

    req.context.processSync = true
    await offline.queue('shift-type', 'delete', shiftType, req.context)

    return 'shift type Deleted'
}
