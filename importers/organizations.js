'use strict'
var organizations = require(`../services/organizations`)
var jsonfile = require('jsonfile')

exports.run = function (req, onComplete, onProgress) {
    if (!req.file) {
        return onComplete('json file is required')
    }

    var model = jsonfile.readFileSync(req.file)

    organizations.create(model, onComplete)
}
