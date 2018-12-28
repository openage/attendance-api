'use strict'
const fs = require('fs')
const join = require('path').join
const camelCase = require('camel-case')
const _ = require('underscore')

const generators = {}

const init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var generator = require('./' + file)
            var name = file.substring(0, file.indexOf('.js'))
            generators[name] = generator
        }
    })
}

init()

module.exports = generators
