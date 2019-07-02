'use strict'
const devices = require('../services/devices')
const mapper = require('../mappers/deviceLog')
const _ = require('underscore')
const moment = require('moment')
const async = require('async')
const db = require('../models')

exports.create = (req, res) => {
    devices.log(req.body.deviceId, req.body.status, req.body.description, req.context)
        .then(log => {
            return res.success()
        })
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    var whereQuery = {}

    var filters = {
        level: req.query.level,
        date: req.query.date,
        deviceId: req.query.deviceId,
        description: req.query.description
    }

    if (filters.description) {
        whereQuery.description = {
            $regex: filters.description,
            $options: 'i'
        }
        filters.level = 'd'
    }

    switch (filters.level || 'all') {
    case 'all':
        whereQuery.status = {
            $regex: /info|error/,
            $options: 'i'
        }
        break
    case 'd':
        break
    default:
        whereQuery.status = {
            $regex: filters.level,
            $options: 'i'
        }
        break
    }
    if (filters.date) {
        whereQuery.created_At = {
            $gte: moment(filters.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d,
            $lt: moment(filters.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
        }
    }

    if (filters.deviceId) {
        whereQuery.device = filters.deviceId
    } else {
        whereQuery.device = {
            $in: req.context.organization.devices
        }
    }
    async.parallel({
        count: (cb) => {
            db.deviceLog.find(whereQuery)
                .count()
                .exec((err, count) => {
                    if (err) {
                        return cb(err)
                    }
                    return cb(null, count)
                })
        },
        deviceLogs: (cb) => {
            db.deviceLog.find(whereQuery)
                .populate({
                    path: 'device',
                    populate: {
                        path: 'machine'
                    }
                })
                .limit(parseInt(req.query.pageSize))
                .skip(parseInt(req.query.pageNo - 1) * parseInt(req.query.pageSize))
                .sort({
                    'created_At': -1
                })
                .exec((err, deviceLogs) => {
                    if (err) {
                        return cb(err)
                    }
                    return cb(null, deviceLogs)
                })
        }
    }, (err, result) => {
        if (err) {
            return res.failure(err)
        }
        return res.page(mapper.toSearchModel(result.deviceLogs), Number(req.query.pageSize), Number(req.query.pageNo), result.count)
    })
}
