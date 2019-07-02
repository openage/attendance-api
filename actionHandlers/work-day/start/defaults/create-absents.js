const db = require('../../../../models')
const attendanceService = require('../../../../services/attendances')

exports.process = async (data, context) => {
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

        await attendanceService.getAttendanceByDate(data.date, employee, { create: true }, context)

        log.end()
    }
}
