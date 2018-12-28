'use strict'
let fs = require('fs')
let join = require('path').join

let _ = require('lodash')

let services = {}

let init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var name = _.camelCase(file.substring(0, file.indexOf('.js')))
            services[name] = require('./' + file)
        }
    })
}

init()

module.exports = services
