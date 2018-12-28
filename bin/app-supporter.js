'use strict'
global.Promise = require('bluebird')
const timeout = require('connect-timeout') // express v4
global.processSync = false

const cors = require('cors')
const express = require('express')
const logger = require('@open-age/logger')('app')
const http = require('http')
const serverConfig = require('config').get('webServer')
const port = process.env.PORT || serverConfig.port

require('../helpers/string')
require('../helpers/number')
require('../helpers/toObjectId')
require('../helpers/period')
var app = express()

// for allow cross origin
app.use(cors())

require('../settings/database').configure(app)
require('../settings/queue').configure()
require('../settings/express').configure(app)
require('../settings/routes').configure(app)
require('../settings/preparations').init()

function haltOnTimedout (req, res, next) {
    if (!req.timedout) next()
}

app.use(timeout(120000))
app.use(haltOnTimedout)

var server = http.createServer(app)
logger.info('environment: ' + process.env.NODE_ENV)

logger.info('starting server')
server.listen(port, function () {
    logger.info('listening on port:' + port)
})

module.exports = app
