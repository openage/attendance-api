'use strict'

const logger = require('@open-age/logger')('generator/report')
const csvProcessor = require('json2csv')

exports.generate = (headers, data) => {
    logger.start('generate')

    return new Promise((resolve, reject) => {
        return csvProcessor({fields: headers, data: data}, (err, csv) => {
            if (err) {
                return reject(err)
            }
            return resolve(csv)
        })
    })
}
