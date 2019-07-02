const db = require('../../../models')

exports.process = async (leaveType, context) => {
    let employees = await db.employee.find({
        'status': 'active',
        'organization': context.organization
    })

    let units = 0

    if (leaveType.periodicity && leaveType.periodicity.type === 'manual') {
        units = leaveType.unitsPerDay * leaveType.periodicity.value
        context.logger.debug(`granting '${units}' to all employees`)
    }

    for (const employee of employees) {
        context.logger.start({
            employee: employee.id
        }`creating leave balance of ${employee.name}`)
        await new db.leaveBalance({
            leaveType: leaveType,
            employee: employee,
            units: units,
            unitsAvailed: 0
        }).save()
    }
}
