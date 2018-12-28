'use strict'

const logger = require('@open-age/logger')('actionHandlers/report/create')
const processors = require('../../../../processors/insights')
const db = require('../../../../models')

exports.process = (data, context, callback) => {
    logger.start('process')

    return db.report.findById(data.id)
        .then((report) => {
            if (!report) {
                return callback('no report found')
            }

            processors[report.params.type].generateReport(report)
                .then((report) => {
                    return callback()
                })
                .catch(err => {
                    return callback(err)
                })
        })
        .catch((err) => {
            return callback(err)
        })
}
