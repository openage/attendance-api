'use strict'
const webHook = require('../../../helpers/web-hook')

exports.process = async (attendance, context) => {
    await webHook.send('attendance', 'onCreate', attendance, context)
}
