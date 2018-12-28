'use strict'

const db = require('../models')

exports.createOrFindTagType = (model) => {
    return new Promise((resolve, reject) => {
        return db.tagType.findOrCreate(model)
            .then(tagType => {
                return resolve(tagType)
            })
            .catch(err => {
                return reject(err)
            })
    })
}
