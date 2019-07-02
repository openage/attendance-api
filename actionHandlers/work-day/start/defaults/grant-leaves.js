const db = require('../../../../models')
const leaveBalanceService = require('../../../../services/leave-balances')

exports.process = async (date, context) => {
    let count = await db.leaveType.find({
        'periodicity.type': 'work-day',
        organization: context.organization
    }).count()

    if (!count) {
        return
    }

    let employees = await db.employee.find({
        organization: context.organization,
        status: 'active'
    }).populate('organization')

    employees = employees || []

    context.logger.debug(`${employees.length} employee(s) fetched`)

    for (const employee of employees) {
        let log = context.logger.start({
            employee: employee.id
        })
        await leaveBalanceService.runWorkDayRules(employee, {}, context)
        log.end()
    }
}
