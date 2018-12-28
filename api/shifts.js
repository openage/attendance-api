'use strict'
const mapper = require('../mappers/shift')
const dbQuery = require('../helpers/querify')
const moment = require('moment')
const db = require('../models')

let createShift = (data) => {
    return new db.shift(data)
        .save()
}

let getShiftType = shiftType => {
    return new Promise((resolve, reject) => {
        if (typeof shiftType !== 'string') {
            return resolve(shiftType)
        }
        dbQuery.findShiftType({ _id: shiftType })
            .then(shiftType => {
                return resolve(shiftType)
            })
    })
}

exports.create = (req, res) => {
    let model = req.body

    let data = {
        date: model.date
    }

    getShiftType(model.shiftType)
        .then(shiftType => {
            data.shiftType = shiftType
            createShift(data)
                .then(shift => {
                    res.data(mapper.toModel(shift))
                })
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.createMultiple = (req, res) => {
    let model = req.body

    let data = {
        date: model.date,
        shiftType: model.shiftType
    }

    for (var index = 0; index < 365; index++) {
        if (index) {
            data.date = moment(data.date).add(1, 'days').toDate()
        }
        createShift(data)
            .then(shift => {
                console.log(`${shift.date} created`)
            })
    }

    res.success('365 shifts inserted')
}

exports.search = (req, res) => {
    if (!req.query.shiftTypeId) {
        return res.failure('shiftType Id is required')
    }

    let query = {
        shiftType: req.query.shiftTypeId
    }

    db.shift.find(query).populate('shiftType')
        .then(shifts => {
            res.page(mapper.toSearchModel(shifts))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.get = (req, res) => {
    let query = {
        _id: req.params.id
    }

    db.shift.findOne(query).populate('shiftType')
        .then(shift => {
            res.data(mapper.toModel(shift))
        })
        .catch(err => {
            res.failure(err)
        })
}
