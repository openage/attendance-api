'use strict'
var fs = require('fs')

var mappers = {}

var init = function () {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file.indexOf('.js') && file.indexOf('index.js') < 0) {
            var mapper = require('./' + file)

            var name = file.substring(0, file.indexOf('.js'))

            // use toModel as toSummary if one is not defined
            if (!mapper.toSummary) {
                mapper.toSummary = mapper.toModel
            }

            if (!mapper.toModels) {
                mapper.toModels = function (entities) {
                    var models = []

                    entities.forEach(entity => {
                        models.push(mapper.toSummary(entity))
                    })

                    return models
                }
            }

            mappers[name] = mapper
        }
    })
}

init()

module.exports = mappers
