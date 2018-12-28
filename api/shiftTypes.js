'use strict'
const mapper = require('../mappers/shiftType')
const dbQuery = require('../helpers/querify')
const moment = require('moment')
const shiftTypes = require('../services/shift-types')
const offline = require('@open-age/offline-processor')
const db = require('../models')

let createShiftType = data => {
    return new db.shiftType(data)
        .save()
}

exports.create = (req, res) => {
    let model = req.body

    let data = {
        name: model.name,
        code: model.code,
        unitsPerDay: model.unitsPerDay,
        startTime: moment(model.startTime).set('seconds', 0).set('milliseconds', 0),
        endTime: moment(model.endTime).set('seconds', 0).set('milliseconds', 0),
        monday: model.monday,
        tuesday: model.tuesday,
        wednesday: model.wednesday,
        thursday: model.thursday,
        friday: model.friday,
        saturday: model.saturday,
        sunday: model.sunday,
        organization: req.context.organization // organization id
    }

    dbQuery.findShiftType({
        $or: [{ name: data.name, organization: req.context.organization.id },
            { code: data.code, organization: req.context.organization.id }
        ]
    })
        .then(shiftType => {
            if (shiftType) {
                throw new Error('code/name already exist')
            }
            createShiftType(data)
                .then(shiftType => {
                    res.data(mapper.toModel(shiftType))
                })
                .catch(err => {
                    return res.failure(err)
                })
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.update = (req, res) => {
    let toUpdate = req.body

    if (toUpdate.startTime) {
        moment(toUpdate.startTime).set('seconds', 0).set('milliseconds', 0)
    }

    if (toUpdate.endTime) {
        moment(toUpdate.startTime).set('seconds', 0).set('milliseconds', 0)
    }

    let query = {
        _id: req.params.id
    }
    db.shiftType.findByIdAndUpdate(query, { $set: toUpdate }, { new: true })
        .then((shiftType) => res.data(mapper.toModel(shiftType)))
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let query = {
        organization: req.context.organization.id,
        status: { $ne: 'inactive' }
    }

    dbQuery.findShiftTypes(query)
        .then(shiftTypes => {
            if (shiftTypes.length > 1) {
                shiftTypes.sort((x, y) => {
                    return new Date(x.startTime.getHours()) - new Date(y.startTime.getHours())
                })
            }
            res.page(mapper.toSearchModel(shiftTypes))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.get = (req, res) => {
    let query = {
        _id: req.params.id
    }

    dbQuery.findShiftType(query)
        .then(shiftType => {
            res.data(mapper.toModel(shiftType))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.getByDate = (req, res) => {
    if (!req.query.date) {
        return res.failure('date is required')
    }

    if (!req.query.employee) {
        return res.failure('employee is required')
    }

    shiftTypes.getByDate(req.query.date, req.query.employee, req.context)
        .then((shiftType) => {
            return res.data(mapper.toModel(shiftType))
        })
}

exports.delete = async (req, res) => {
    let shiftType = await db.shiftType.findById(req.params.id)

    if (shiftType.code.toLowerCase() === 'gen') {
        return res.failure('general shift can not be deletd')
    }
    await db.shiftType.findByIdAndUpdate({
        _id: req.params.id
    }, {
        $set: {
            status: 'inactive'
        }
    })

    req.context.processSync = true
    offline.queue('shift', 'delete', { shiftType: shiftType }, req.context)

    return res.success('shiftType Deleted')
}
