'use strict'
var fs = require('fs')
var join = require('path').join
var mongoose = require('mongoose')

var init = function () {
    if (global._models_init) {
        return
    }
    // set all the models on db
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            require('./' + file)
        }
    })
    global._models_init = true
}

init()

module.exports = mongoose.models
