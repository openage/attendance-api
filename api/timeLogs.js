'use strict'
const moment = require('moment')
const appRoot = require('app-root-path')
const join = require('path').join
const mapper = require('../mappers/timeLog')
const logger = require('@open-age/logger')('api.timeLogs')
const offline = require('@open-age/offline-processor')
const timeLogs = require('../services/time-logs')
const db = require('../models')

const getIpAddress = (req) => {
    if (req.headers['x-forwarded-for']) {
        return req.headers['x-forwarded-for'].split(',')[0]
    } else if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress
    } else {
        return req.ip
    }
}

exports.downloadSyncSheet = (req, res) => {
    let fileName = req.params.filename
    res.download(`${join(appRoot.path, `/temp/${fileName}`)}`, fileName)
}
exports.bulk = async (req) => {
    for (const item of req.body.items) {
        await timeLogs.create(item, req.context)
    }

    return `added '${req.body.items.length}' logs`
}

exports.create = async (req, res) => {
    let model = req.body
    let employeeId = req.employee.id

    if (!model.source) {
        return res.failure('source is required')
    }

    if (!req.employee.abilities.maualAttendance &&
        !model.device &&
        model.source !== 'byAdmin') {
        return res.failure('device is required')
    }

    if (!model.type) {
        return res.failure('type is required')
    }

    if (req.body.employee) {
        employeeId = req.body.employee.id
    }

    model.employee = {
        id: employeeId
    }

    model.ipAddress = getIpAddress(req)

    req.context.processSync = true
    let timeLog = await timeLogs.create(model, req.context)

    timeLog.attendance = db.attendance.findOne({
        recentMostTimeLog: timeLog
    })
    return mapper.toModel(timeLog)
}

exports.search = (req, res) => {
    let employee = req.employee
    let toDate
    let fromDate
    let query = {
        employee: employee
    }
    if (req.query.employeeId) {
        query.employee = req.query.employeeId
    }

    if (req.query.fromDate) {
        fromDate = moment(req.query.fromDate).startOf('day').toDate()
        toDate = moment(req.query.fromDate).startOf('day').add(1, 'day').toDate()
    } else {
        fromDate = moment().startOf('day').toDate()
        toDate = moment().startOf('day').add(1, 'day').toDate()
    }

    query.time = {
        $gte: fromDate,
        $lt: toDate
    }

    db.timeLog.find(query)
        .populate('device')
        .sort({
            time: 1
        })
        .then(timeLogs => {
            res.page(mapper.toSearchModel(timeLogs))
        }).catch(err => {
            res.failure(err)
        })
}
