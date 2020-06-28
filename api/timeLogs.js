'use strict'
const appRoot = require('app-root-path')
const join = require('path').join
const mapper = require('../mappers/timeLog')
const offline = require('@open-age/offline-processor')
const timeLogs = require('../services/time-logs')
const attendanceService = require('../services/attendances')
const dates = require('../helpers/dates')
const pager = require('../helpers/paging')
const ipAddress = require('../helpers/ip-address')

exports.downloadSyncSheet = (req, res) => {
    let fileName = req.params.filename
    res.download(`${join(appRoot.path, `/temp/${fileName}`)}`, fileName)
}

const bulk = async (req) => {
    for (const item of req.body.items) {
        req.context.logger.debug(item)
        if (item.employee === 'my') {
            item.employee = req.context.user.id
        }
        req.context.logger.debug(item.employee)

        await timeLogs.create(item, req.context)
    }
    return `added '${req.body.items.length}' time logs`
}

exports.move = async (req) => {
    await attendanceService.moveTimeLog(req.body.timeLog, req.body.from, req.body.to, req.context)
    return `moved`
}

exports.create = async (req) => {
    let model = req.body
    let employeeId = req.body.employee ? req.body.employee.id : req.context.user.id

    if (req.body.employee && req.body.employee.code === 'my') {
        employeeId = req.context.user.id
    }

    if (employeeId === req.context.user.id && !model.device) {
        model.source = 'self'
    }

    if (model.source === 'self' && !req.context.hasPermission('check-in.self')) {
        throw new Error('ACCESS_DENIED')
    }

    if (!model.source) {
        throw new Error('SOURCE_MISSING')
    }

    if (!model.device && (model.source !== 'byAdmin' && model.source !== 'self')) {
        throw new Error('DEVICE_MISSING')
    }

    if (!model.type) {
        throw new Error('TYPE_MISSING')
    }

    if (!model.time) {
        if (model.source === 'self') {
            model.time = new Date()
        } else {
            throw new Error('TIME_MISSING')
        }
    }

    model.employee = {
        id: employeeId
    }

    model.ipAddress = ipAddress.parse(req)

    req.context.processSync = true
    let timeLog = await timeLogs.create(model, req.context)

    timeLog.attendance = await attendanceService.get(timeLog.attendanceId, req.context)
    return mapper.toModel(timeLog, req.context)
}

exports.update = async (req) => {
    let id = req.params.id
    req.context.processSync = true
    let timeLog = await timeLogs.update(id, req.body, req.context)

    return mapper.toModel(timeLog, req.context)
}

exports.search = async (req) => {
    let paging = pager.extract(req)
    let result = await timeLogs.search(req.query, paging, req.context)

    if (req.query['attendance-date'] && req.query['user-code']) {
        req.query.user = {
            code: req.query['user-code']
        }

        let date = dates.date(req.query['attendance-date']).bod()
        let employee = {
            id: req.query['user-code'] === 'my' ? req.context.user.id : req.query['user-code']
        }
        req.attendance = await attendanceService.getAttendanceByDate(date, employee, {
            create: true
        }, req.context)
    }

    let page = {
        items: mapper.toSearchModel(result.items),
        total: result.count
    }

    if (paging) {
        page.pageNo = paging.pageNo
        page.pageSize = paging.limit
    }

    return page
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
