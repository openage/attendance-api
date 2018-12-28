'use strict'

const logger = require('@open-age/logger')('actionHandlers/employee/update')
const employees = require('../../../../services/employees')
const ed = require('../../../../providers/ems')

exports.process = (data, context, callback) => {
    logger.start('process')

    let employee = ed.reform(data.employee, context)

    return employees.updateCreateEmployee(employee, context)
        .then(() => {
            logger.info('employee updated successfully')
            return callback()
        })
        .catch((err) => {
            logger.error(err)
            return callback(err)
        })
}
