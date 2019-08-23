'use strict'
const moment = require('moment')
const appRoot = require('app-root-path')
const join = require('path').join
const mapper = require('../mappers/timeLog')
const offline = require('@open-age/offline-processor')
const timeLogs = require('../services/time-logs')
const attendanceService = require('../services/attendances')
const db = require('../models')
const dates = require('../helpers/dates')

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
const bulk = async (req) => {
    for (const item of req.body.items) {
        req.context.logger.debug(item)
        req.context.logger.debug(item.employee)

        await timeLogs.create(item, req.context)
    }
    return `added '${req.body.items.length}' time logs`
}

exports.move = async (req) => {
    await attendanceService.moveTimeLog(req.body.timeLog, req.body.from, req.body.to, req.context)
    return `moved`
}

exports.create = async (req, res) => {
    let model = req.body
    let employeeId = req.context.user.id

    if (!model.source) {
        return res.failure('source is required')
    }

    if (!req.context.user.abilities.maualAttendance &&
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

    if (!model.time) {
        return res.failure('time is required')
    }

    model.employee = {
        id: employeeId
    }

    model.ipAddress = getIpAddress(req)

    req.context.processSync = true
    let timeLog = await timeLogs.create(model, req.context)

    timeLog.attendance = attendanceService.get(timeLog.attendanceId)
    return mapper.toModel(timeLog, req.context)
}

exports.update = async (req) => {
    let id = req.params.id
    req.context.processSync = true
    let timeLog = await timeLogs.update(id, req.body, req.context)

    return mapper.toModel(timeLog, req.context)
}

exports.search = (req, res) => {
    let employee = req.context.user
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
            res.page(mapper.toSearchModel(timeLogs, req.context))
        }).catch(err => {
            res.failure(err)
        })
}

exports.regenerate = async (req) => {
    let from = dates.date(req.query.date || req.body.date).bod()
    let till = dates.date(req.query.date || req.body.date).eod()

    let entity = {
        from: from,
        till: till
    }

    await offline.queue('regenerate', 'time-log', entity, req.context)

    return {
        message: 'submitted'
    }
}

exports.bulk = bulk
