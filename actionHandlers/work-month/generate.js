const db = require('../../models')
const monthlyService = require('../../services/monthly-summaries')
const dates = require('../../helpers/dates')

exports.process = async (data, context) => {
    let logger = context.logger.start('fixing')
    let month = dates.date(data.date).bom()

    let employees = []
    if (data.employee && data.employee.id) {
        let byId = await db.employee.findById(data.employee.id).populate('supervisor')
        employees.push(byId)
    } else if (data.employeeCode) {
        let byCode = await db.employee.findOne({
            organization: global.toObjectId(context.organization.id),
            code: data.employeeCode
        }).populate('supervisor')
        employees.push(byCode)
    } else {
        employees = await db.employee.find({
            organization: global.toObjectId(context.organization.id),
            status: 'active'
        }).populate('supervisor')
    }

    logger.debug(`fetched '${employees.length}' employee(s)`)

    for (const employee of employees) {
        await monthlyService.update(month, employee, context)
    }
    logger.end()
}
