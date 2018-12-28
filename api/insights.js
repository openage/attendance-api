'use strict'

const logger = require('@open-age/logger')('api/insights')
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const insights = require('../services/insights')
const processors = require('../processors/insights')
const dailyInsightMapper = require('../mappers/dailyInsight')
const reportMapper = require('../mappers/report')
const alertMapper = require('../mappers/alert')
const _ = require('underscore')
const db = require('../models')

exports.getAlert = (req, res) => {
    let alertId = req.params.id

    db.alert.findById(alertId)
        .populate('alertType')
        .then(alert => {
            if (!alert) {
                throw new Error('no alert found')
            }
            return res.data(alertMapper.toModel(alert))
        })
        .catch(err => res.failure(err))
}

exports.getInsightByAlert = async (req, res) => {
    logger.start('getByAlert')

    const id = req.params.id
    const employeeId = req.employee.id
    const date = req.params.date ? moment(req.params.date).startOf('day') : moment().subtract(1, 'day').startOf('day')

    const alert = await db.alert.findById(id).populate('alertType')
    insights.findOrCreate(alert, employeeId, date)
        .then((dailyInsight) => {
            dailyInsight.alert = alert
            return res.data(dailyInsightMapper.toModel(dailyInsight))
        })
}

exports.getEmployees = async (req, res) => {
    logger.start('getEmployeeList')

    const id = req.params.id

    const params = req.body.params

    const supervisor = req.employee

    const date = req.params.date ? moment(req.params.date).startOf('day')._d : moment().startOf('day')._d

    const query = {
        employee: req.employee,
        date: date,
        alert: id
    }

    const insight = await db.dailyInsight.findOne(query).populate({ path: 'alert', populate: { path: 'alertType' } })

    let employeesList = await processors[insight.alert.alertType.code].listQuery(supervisor, params, insight, date)

    return res.page(dailyInsightMapper.toEmployeeInsightList(employeesList))
}

exports.createReport = async (req, res) => {
    logger.start('getEmployeeList')

    const params = req.body.params

    const supervisor = req.employee

    const alert = req.params.id

    const report = await new db.report({
        requestedAt: new Date(),
        status: 'new',
        employee: supervisor,
        alert: alert,
        params: params
    }).save()

    let context = {}
    context.organization = {}
    context.organization.id = req.context.organization.id.toString()
    context.processSync = true

    offline.queue('report', 'create', { id: report.id }, context)

    return res.data(reportMapper.toModel(report))
}

exports.getReports = async (req, res) => {
    logger.start('getReports')

    const supervisor = req.employee

    const alert = req.params.id

    let reoprts = await db.report.find({ employee: supervisor, alert: alert })

    return res.data(reportMapper.toSearchModel(reoprts))
}

exports.search = (req, res) => {
    let myOrg = req.context.organization

    let matchQuery = {
        'organization': toObjectId(req.context.organization.id)
    }

    if (req.query.hasInsights) {
        matchQuery['alertType.hasInsights'] = req.query.hasInsights !== 'false'
    }

    if (req.query.hasNotifications) {
        matchQuery['alertType.hasNotifications'] = req.query.hasNotifications !== 'false'
    }

    if (req.query.hasReports) {
        matchQuery['alertType.hasReports'] = req.query.hasReports !== 'false'
    }

    db.alert.aggregate([{
        $lookup: {
            localField: 'alertType',
            from: 'alerttypes',
            foreignField: '_id',
            as: 'alertType'
        }
    },
    {
        $match: matchQuery
    },
    {
        $project: {
            'id': 1,
            'config': 1,
            'organization': 1,
            'status': 1,
            'alertType': { '$arrayElemAt': ['$alertType', 0] }
        }
    }
    ])
        .then(alerts => {
            return alerts
        })
        .then(alerts => {
            res.page(alertMapper.toSearchModel(alerts))
        })
        .catch(err => res.failure(err))
}
