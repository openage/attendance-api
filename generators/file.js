'use strict'

const logger = require('@open-age/logger')('generators/file')
const fs = require('fs')

exports.generate = (filePath, file) => {
    logger.start('generate')

    return new Promise((resolve, reject) => {
        return fs.writeFile(filePath, file, err => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}
