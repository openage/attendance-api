'use strict'
const mapper = require('../mappers/holiday')
const dbQuery = require('../helpers/querify')
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const db = require('../models')

let createHoliday = (data) => {
    return new db.holiday(data)
        .save()
}

let toFromDate = holiday => {
    let fromDate = moment(holiday.date)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)

    let toDate = moment(holiday.date)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')
    return {
        fromDate: fromDate,
        toDate: toDate
    }
}

exports.create = (req, res) => {
    let model = req.body

    let creator = {
        date: model.date,
        name: model.name,
        organization: req.context.organization.id
    }

    dbQuery.getHoliday({
        date: model.date,
        organization: req.context.organization.id
    })
        .then(holiday => {
            if (holiday) {
                throw `This date already alloted to ${holiday.name}`
            }
            return createHoliday(creator)
                .then(holiday => {
                    res.data(mapper.toModel(holiday))
                    return holiday
                })
        })
        .then(holiday => {
            return db.shiftType.find({
                organization: req.context.organization.id
            })
                .then(shiftTypes => {
                    return {
                        shiftTypes: shiftTypes,
                        holiday: holiday
                    }
                })
        })
        .then(data => {
            let dates = toFromDate(data.holiday)
            return Promise.each(data.shiftTypes, shiftType => {
                return db.shift.findOrCreate({
                    date: {
                        $gte: dates.fromDate,
                        $lt: dates.toDate
                    },
                    shiftType: shiftType
                }, {
                    holiday: data.holiday,
                    status: 'holiday',
                    date: dates.fromDate,
                    shiftType: shiftType
                }, {
                    upsert: true
                })

                    .then(newShift => {
                        return offline.queue('holiday', 'create', {
                            orgId: req.context.organization.id,
                            shift: newShift.result
                        }, req.context)
                    })
                    .catch(err => {
                        throw err
                    })
            })
                .catch(err => {
                    throw err
                })
        })
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let query = {
        organization: req.context.organization.id
    }

    if (req.query.date) {
        query.date = {
            $gte: moment(req.query.date).startOf('day').toDate()
        }
    }
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)
    let totalRecordsCount = 0

    Promise.all([
        db.holiday.find(query).count(),
        db.holiday.find(query).sort({
            date: 1
        }).skip(fromPage).limit(pageLmt)
    ]).then((result) => {
        return res.page(mapper.toSearchModel(result[1]), pageLmt, PageNo, result[0])
    }).catch(err => res.failure(err))
}

exports.get = (req, res) => {
    if (!req.params.date) {
        return res.failure('no date found')
    }

    let query = {
        organization: req.context.organization.id,
        date: req.params.date
    }

    db.holiday.findOne(query)
        .then(holiday => res.data(mapper.toModel(holiday)))
        .catch(err => {
            res.failure(err)
        })
}
