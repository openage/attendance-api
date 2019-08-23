'use strict'

const webHook = require('../../../../helpers/web-hook')

exports.process = async (leave, context) => {
    webHook.send('leave', 'onReject', leave, context)
}
