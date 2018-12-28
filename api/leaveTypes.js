'use strict'
const mapper = require('../mappers/leaveType')
const dbQuery = require('../helpers/querify')
const db = require('../models')
const offline = require('@open-age/offline-processor')

exports.create = async (req) => {
    let model = req.body
    if (!model.name || !model.unitsPerDay || !model.category) {
        throw new Error('-name-unitsPerDay-category required to create')
    }

    model.periodicity = model.periodicity || {}
    model.periodicity.type = model.periodicity.type || 'manual'
    model.organization = req.context.organization

    let leaveType = new db.leaveType(model)
    await leaveType.save()
    await offline.queue('leave-type', 'create', { id: leaveType.id }, req.context)
    return mapper.toModel(leaveType)
}

exports.search = (req, res) => {
    let query = {
        organization: req.context.organization.id
    }

    dbQuery.findLeaveTypes(query)
        .then(leaveTypes => res.page(mapper.toSearchModel(leaveTypes)))
        .catch(err => res.failure(err))
}

exports.get = (req, res) => {
    let query = {
        _id: req.params.id
    }
    dbQuery.findLeaveType(query)
        .then(shiftType => res.data(mapper.toModel(shiftType)))
        .catch(err => res.failure(err))
}

exports.delete = (req, res) => {
    let query = {
        _id: req.params.id
    }
    // TODO deleted only by admin
    db.leaveBalance.remove({ leaveType: req.params.id })
        .then(() => db.leave.remove({ leaveType: req.params.id }))
        .then(() => db.leaveType.remove(query))
        .then(() => res.success('deleted successfully'))
        .catch(err => res.failure(err))
}

exports.update = (req, res) => {
    let toUpdate = req.body
    let query = {
        _id: req.params.id
    }
    // TODO updated only by admin
    db.leaveType.findOneAndUpdate(query, { $set: toUpdate }, { new: true })
        .then((leaveType) => res.data(mapper.toModel(leaveType)))
        .catch(err => res.failure(err))
}
