const db = require('../../../models')

const shiftTypeService = require('../../../services/shift-types')

exports.process = async (data, context) => {
    let logger = context.logger.start('fixing')
    let query = {
        organization: global.toObjectId(context.organization.id),
        status: 'active'
    }

    let employees = await db.employee.find(query)

    logger.debug(`fetched '${employees.length}' employee(s)`)

    for (const employee of employees) {
        let log = logger.start(employee.code)
        await shiftTypeService.reset(employee, context)
        log.end()
    }
    logger.end()
}
