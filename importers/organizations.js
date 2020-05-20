'use strict'
var organizations = require(`../services/organizations`)
var jsonfile = require('jsonfile')

exports.run = async (req, context) => {
    if (!req.file) {
        throw new Error('json file is required')
    }

    var model = jsonfile.readFileSync(req.file)

    await organizations.create(model, context)
}
