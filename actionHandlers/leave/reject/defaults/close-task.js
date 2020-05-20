'use strict'
const leaves = require('../../../../services/leaves')
const gateway = require('@open-age/gateway-client')

exports.process = async (leave, context) => {

    let task = {
        isClosed: true
    }

    gateway.tasks.update(leave.id, task, context)

}