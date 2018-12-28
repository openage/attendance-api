'use strict'
var fs = require('fs')

var insights = {}

var init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var insight = require('./' + file)

            var name = file.substring(0, file.indexOf('.js'))

            insights[name] = insight
        }
    })
}

init()

module.exports = insights
