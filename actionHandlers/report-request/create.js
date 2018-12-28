'use strict'
const logger = require('@open-age/logger')('report-request')
const appRoot = require('app-root-path')
var fs = require('fs')
const webConfig = require('config').get('webServer')
const fsConfig = require('config').get('folders')
const db = require('../../models')
const excel = require('../../helpers/xlsx-builder')

const create = async (generator, request, params, context) => {
    let data = await generator.data(params, context)
    let format = (await generator.format(params, context)).xlsx
    let headers = excel.buildHeaders(await generator.headers(params, context), format.styles)
    const file = excel.newWorkbook(`${request.type}-${request.id}.xlsx`)
    var sheet = file.createSheet(format.sheet, headers.length + 5, data.length + 10)
    let currentRow = format.reportHeader(sheet)
    currentRow = excel.setHeader(sheet, currentRow + 1, headers)

    for (const row of data) {
        currentRow = currentRow + 1
        for (const header of headers) {
            excel.setValue(sheet, currentRow, header, row)
        }
    }
    return file.save()
}

// the default processing would be done here
exports.process = async (reportRequest, context, cb) => {
    const log = context.logger.start(`process-${reportRequest.id}`)
    reportRequest.startedAt = new Date()
    const provider = require(reportRequest.provider === 'ems'
        ? '../../providers/ems/reports'
        : '../../reports')
    const generator = provider ? provider[reportRequest.type] : null

    if (!provider || !generator) {
        if (!provider) {
            log.error('provider not found')
        } else if (!generator) {
            log.error('generator not found')
        }

        reportRequest.error = `either '${reportRequest.provider}' does not exist or it does not support report '${reportRequest.type}'`
        reportRequest.status = 'errored'
        reportRequest.completedAt = new Date()
        return reportRequest.save()
    }

    reportRequest.status = 'in-progress'
    let reportParams = reportRequest.reportParams ? JSON.parse(reportRequest.reportParams) : {}
    await reportRequest.save()
    log.debug('started the request with report params', reportParams)

    try {
        let filePath
        let report

        if (generator.data) {
            report = await create(generator, reportRequest, reportParams, context)
            filePath = fsConfig.temp ? `${fsConfig.temp}/${report.fileName}` : `${appRoot}/temp/${report.fileName}`
        } else {
            context.reportRequest = reportRequest
            report = await generator(reportParams, context)
            filePath = report.path
        }

        log.debug('created the file')
        reportRequest.completedAt = new Date()
        reportRequest.status = 'ready'
        reportRequest.filePath = filePath
        reportRequest.fileUrl = `${webConfig.url}/reports/${report.fileName}`
        await reportRequest.save()
        log.info('generated')
    } catch (error) {
        reportRequest.error = error.toString()
        reportRequest.status = 'errored'
        reportRequest.completedAt = new Date()
        log.error('got err while fetching', error)
        await reportRequest.save()
    }

    log.end()
}

exports.onError = async (data, context) => {
    const log = context.logger.start(`process-${data.id}`)
    const reportRequest = await db.reportRequests.findById(data.id)
    if (!reportRequest) {
        log.debug(`no 'in-progress' request found with id: ${data.id}`)
        return
    }
    log.debug('got the request', reportRequest.id)

    reportRequest.error = data.error
    reportRequest.status = 'errored'
    reportRequest.completedAt = new Date()
    await reportRequest.save()

    log.end()
}
