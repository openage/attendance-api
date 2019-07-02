const db = require('../../models')
const dates = require('../../helpers/dates')
const moment = require('moment')

const attendanceService = require('../../services/attendances')
const taskService = require('../../services/tasks')

const monthlySummaryService = require('../../services/monthly-summaries')

const resetAttendance = async (attendance, employee, date, context) => {
    try {
        if (!attendance) {
            if (date > new Date()) {
                return
            }

            await attendanceService.getAttendanceByDate(date, employee, { create: true }, context)
        } else {
            await attendanceService.reset(attendance, {
                removeWeekOff: false,
                adjustTimeLogs: true,
                recalculateShift: true
            }, context)
        }
    } catch (err) {
        context.logger.error(err)
        let task = context.task
        task.meta.errors = task.meta.errors || []
        task.meta.errors.push({
            message: err.message || err,
            stack: err.stack,
            employee: employee.code,
            date: date
        })

        task.markModified('meta')
        await task.save()
    }
}

const resetMonth = async (employee, fromDate, toDate, logger, context) => {
    let log = logger.start(employee.code)
    log.debug(`fetching attendances`)
    let attendances = await db.attendance.find({
        employee: employee,
        ofDate: {
            $gte: fromDate,
            $lt: toDate
        }
    })
        .populate('employee timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    attendances = attendances || []

    for (var day = 1; day <= moment(fromDate).daysInMonth(); day++) {
        log.debug(`fixing ${day}`)
        let date = moment(fromDate).set('date', day).toDate()
        let attendance = attendances.find(item => dates.date(item.ofDate).isSame(date))
        await resetAttendance(attendance, employee, date, context)
    }

    await monthlySummaryService.update(fromDate, employee, context)
}

exports.subscribe = async (data, context) => {
    let logger = context.logger.start('fixing')

    let fromDate = dates.date(data.date).bom()
    let toDate = dates.date(data.date).eom()

    let meta = {
        date: fromDate
    }

    if (data.employee && data.employee.id) {
        meta.employee = {
            id: data.employee.id
        }
    }

    let task = context.task

    if (!task) {
        task = await taskService.create({
            entity: 'work-month',
            action: 'regenerate',
            meta: meta,
            assignedTo: 'processor',
            progress: 0,
            status: 'in-progress'
        }, context)

        context.task = task
    }

    try {
        let employees = []
        if (data.employee && data.employee.id) {
            let employee = await db.employee.findById(data.employee.id)
            if (employee) {
                employees.push(employee)
            }
        } else {
            employees = await db.employee.find({
                organization: global.toObjectId(context.organization.id),
                status: 'active'
            })
        }

        task.progress = 2
        task.meta.count = employees.length
        task.markModified('meta')
        await task.save()

        logger.debug(`fetched '${employees.length}' employee(s)`)

        let count = 0

        for (const employee of employees) {
            await resetMonth(employee, fromDate, toDate, logger, context)

            count++
            task.progress = 2 + Math.floor(98 * count / employees.length)
            await task.save()
        }
        task.status = 'done'
        await task.save()
    } catch (err) {
        task.status = 'error'
        task.error = {
            message: err.message || err,
            stack: err.stack
        }
        await task.save()
    }

    logger.end()
}
