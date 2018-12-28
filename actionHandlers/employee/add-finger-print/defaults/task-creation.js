'use strict'

const logger = require('@open-age/logger')('employee-add-finger-print')
const tasks = require('../../../../services/tasks')
const db = require('../../../../models')
exports.process = async (data, context, callback) => {
    const log = logger.start('process')

    const employee = await db.employee.findById(data.employee)

    const task = {
        date: new Date(),
        employee: {
            id: employee,
            code: employee.code
        },
        device: data.device,
        organization: context.organization,
        action: 'add',
        status: 'new'
    }

    await tasks.create(task, context)

    return callback()
}
