const db = require('../../../models')
const dates = require('../../../helpers/dates')
const moment = require('moment')

const attendanceService = require('../../../services/attendances')

const resetAttendance = async (attendance, employee, date, context) => {
    if (!attendance) {
        if (date > new Date()) {
            return
        }

        await attendanceService.getAttendanceByDate(date, employee, context)
    } else {
        await attendanceService.reset(attendance, {
            removeWeekOff: false
        }, context)
    }
}

exports.process = async (data, context) => {
    let logger = context.logger.start('fixing')
    let query = {
        organization: global.toObjectId(context.organization.id),
        status: 'active'
    }

    let employees = await db.employee.find(query)

    logger.debug(`fetched '${employees.length}' employee(s)`)

    let fromDate = dates.date(data.date).bom()
    let toDate = dates.date(data.date).eom()

    for (const employee of employees) {
        let log = logger.start(employee.code)
        log.debug(`fetching attendances`)
        let attendances = await db.attendance.find({
            employee: employee,
            ofDate: {
                $gte: fromDate,
                $lt: toDate
            }
        }).populate([{
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        }, {
            path: 'timeLogs'
        }])

        attendances = attendances || []

        for (var day = 1; day <= moment(fromDate).daysInMonth(); day++) {
            log.debug(`fixing ${day}`)
            let date = moment(fromDate).set('date', day).toDate()
            let attendance = attendances.find(item => dates.date(item.ofDate).isSame(date))
            await resetAttendance(attendance, employee, date, context)
        }
    }
    logger.end()
}
