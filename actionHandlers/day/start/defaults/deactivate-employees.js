'use strict'

const teams = require('../../../../services/teams')
const dates = require('../../../../helpers/dates')
const db = require('../../../../models')
const contextBuilder = require('../../../../helpers/context-builder')

exports.process = async (data, context) => {
    let date = data.date || new Date()

    let employees = await db.employee.find({
        status: 'inactive',
        deactivationDate: {
            $lt: dates.date(date).bod()
        }
    }).populate('organization')

    employees = employees || []
    context.logger.info(`${employees.length} employees needs to be deactivated`)

    for (const employee of employees) {
        let log = context.logger.start(`employee: ${employee.code}`)

        let newContext = await contextBuilder.create({
            employee: employee,
            organization: employee.organization
        }, log)
        await teams.setSupervisor(employee, employee.supervisor, newContext)
    }
}
