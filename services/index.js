'use strict'
let fs = require('fs')
const paramCase = require('param-case')

let services = {}

let init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            let name = paramCase(file.split('.')[0])
            services[name] = require('./' + file)
        }
    })
}

init()

module.exports = services
