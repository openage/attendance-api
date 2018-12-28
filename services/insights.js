'use strict'

const logger = require('@open-age/logger')('services/insights')
const moment = require('moment')
const team = require('./teams')
const file = require('../generators/file')
const json2csv = require('../generators/json2csv')
const appRoot = require('app-root-path')
const webConfig = require('config').get('webServer')
const db = require('../models')

const updateStatistics = (dailyInsight, param) => {
    logger.start('updateStatistics')

    dailyInsight.statistics.params.forEach((paramObject) => {
        if (paramObject.key === param.toLowerCase()) {
            paramObject.count++
        }
    })

    dailyInsight.statistics.count++

    return dailyInsight.save()
}

const findOrCreate = async (alert, employeeId, date) => {
    logger.start('findOrCreate')
    const paramsModel = []

    if (alert.config && alert.config.trigger) {
        for (var key in alert.config.trigger) {
            let param = {}
            if (alert.config.trigger.hasOwnProperty(key)) {
                param.key = key
                param.value = alert.config.trigger[key]
                param.count = 0
                paramsModel.push(param)
            }
        }
    }

    const alertStats = {
        count: 0,
        params: paramsModel
    }

    const createModel = {
        alert: alert.id,
        employee: employeeId,
        date: moment(date).startOf('day'),
        statistics: alertStats
    }

    return db.dailyInsight.findOrCreate({
        alert: alert.id,
        employee: employeeId,
        date: moment(date).startOf('day')
    }, createModel)
        .then((dailyInsight) => {
            return dailyInsight.result
        })
        .catch((err) => {
            return err
        })
}

const seniorSupervisorStats = async (alert, seniorSupervisor, param) => {
    logger.start('seniorSupervisorStats')

    const dailyInsight = await findOrCreate(alert, seniorSupervisor)

    return updateStatistics(dailyInsight, param)
}

const supervisorStats = async (alert, supervisor, param) => {
    logger.start('supervisorInsight')

    const dailyInsight = await findOrCreate(alert, supervisor)

    const updatedStatistics = await updateStatistics(dailyInsight, param)

    const seniorSupervisors = await team.getSupervisors(supervisor)

    await Promise.all(seniorSupervisors.map(async (seniorSupervisor) => {
        await seniorSupervisorStats(alert, seniorSupervisor, param)
    }))

    return dailyInsight
}

const createReport = async (report, csvHeaders, team) => {
    logger.start('createReport')

    return json2csv.generate(csvHeaders, team)
        .then(async (csv) => {
            let fileName = `${report.params.type}-${report.startedAt}.csv`
            let filePath = `${appRoot}/temp/${fileName}`
            return file.generate(filePath, file)
                .then(async () => {
                    report.completedAt = new Date()
                    report.status = 'ready'
                    report.filePath = filePath
                    report.fileUrl = `${webConfig.url}/api/reports/${fileName}`
                    return report.save()
                })
                .catch((err) => {
                    throw err
                })
        })
        .catch(async (err) => {
            report.completedAt = new Date()
            report.error = err.toString()
            report.status = 'errored'
            return report.save()
        })
}

exports.supervisorStats = supervisorStats
exports.findOrCreate = findOrCreate
exports.createReport = createReport
