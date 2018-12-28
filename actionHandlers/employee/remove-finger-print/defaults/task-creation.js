'use strict'

const logger = require('@open-age/logger')('employee-remove-finger-print')
const tasks = require('../../../../services/tasks')

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
        action: 'delete',
        status: 'new'
    }
    await tasks.create(task, context)

    return callback()
}