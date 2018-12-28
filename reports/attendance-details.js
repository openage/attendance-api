'use strict'
const moment = require('moment')

// const formatter = require('../formatters/detail-attendance-report')
const db = require('../models')
const dates = require('../helpers/dates')
const attendanceService = require('../services/attendances')
const leaveService = require('../services/leaves')

const timeLogType = attendanceService.timeLogType

const getDaySummary = (employee, leaveSummary, attendances, date, context) => {
    let attendance

    if (attendances && attendances.length) {
        attendance = attendances.find(attendance => {
            if (dates.date(attendance.ofDate).isSame(date)) {
                return true
            }
        })
    }

    if (attendance) {
        attendance.employee = employee
    }
    return attendanceService.getSummary(leaveSummary, attendance, context)
}

const getInOuts = attendance => {
    let values = {
        checkIn: '',
        pass1: {
            out: '',
            in: ''
        },
        pass2: {
            out: '',
            in: ''
        },
        checkOut: ''
    }

    if (!attendance) {
        return values
    }

    if (attendance.checkOut) {
        values.checkOut = attendance.checkOut
    }

    if (attendance.checkIn) {
        values.checkIn = attendance.checkIn
    }

    let timeLogs = attendance.timeLogs || []

    timeLogs = timeLogs.sort((a, b) => a.time - b.time)

    timeLogs.forEach(log => {
        if (log.type === timeLogType.checkIn) {
            let isCheckIn = values.checkIn && moment(values.checkIn).isSame(log.time, 'minutes')
            if (isCheckIn) {
                return
            }
            if (!values.pass1.in) {
                values.pass1.in = log.time
            } else if (!values.pass2.in) {
                values.pass2.in = log.time
            }
        }

        if (log.type === timeLogType.checkOut) {
            let isCheckOut = values.checkOut && moment(values.checkOut).isSame(log.time, 'minutes')
            if (isCheckOut) {
                return
            }
            if (!values.pass1.out) {
                values.pass1.out = log.time
            } else if (!values.pass2.out) {
                values.pass2.out = log.time
            }
        }
    })

    if (values.checkIn) {
        values.checkIn = moment(values.checkIn).format('HH:mm')
    }

    if (values.pass1.in) {
        values.pass1.in = moment(values.pass1.in).format('HH:mm')
    }

    if (values.pass2.in) {
        values.pass2.in = moment(values.pass2.in).format('HH:mm')
    }

    if (values.pass1.out) {
        values.pass1.out = moment(values.pass1.out).format('HH:mm')
    }

    if (values.pass2.out) {
        values.pass2.out = moment(values.pass2.out).format('HH:mm')
    }
    if (values.checkOut) {
        values.checkOut = moment(values.checkOut).format('HH:mm')
    }

    return values
}

const whereClause = (params, context) => {
    let query = {
        organization: global.toObjectId(context.organization.id),
        status: 'active'
    }

    if (params.name) {
        query.name = {
            $regex: params.name,
            $options: 'i'
        }
    }

    if (params.tagIds && params.tagIds.length) {
        let tagIds = []
        let queryTags = params.tagIds.split(',')
        Promise.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query.tags = {
            $in: tagIds
        }
    }

    if (params.code) {
        query.code = {
            $regex: params.code,
            $options: 'i'
        }
    }

    if (params.supervisor) {
        query.supervisor = global.toObjectId(params.supervisor)
    }

    if (params.shiftType) {
        query.shiftType = global.toObjectId(params.shiftType)
    }

    return query
}

exports.data = async (params, context) => {
    let log = context.logger.start('getData')
    let query = whereClause(params, context)

    log.debug('fetching employees')

    let employees = await db.employee.aggregate([{
        $match: query
    }, {
        $project: {
            name: 1,
            displayCode: 1,
            code: 1,
            designation: 1
        }
    }])

    log.debug(`fetched '${employees.length}' employee(s)`)

    employees = employees.sort((a, b) => {
        return a.code - b.code
    })

    let fromDate = dates.date(params.from).bom()
    let toDate = dates.date(params.from).eom()

    for (const employee of employees) {
        employee.leaves = await db.leave.find({
            employee: global.toObjectId(employee._id),
            status: 'approved',
            date: {
                $gte: fromDate,
                $lt: toDate
            }
        }).populate('leaveType')

        employee.attendances = await db.attendance.find({
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
        if (!employee.attendances) {
            employee.attendances = []
        }
    }

    let serialNo = 1
    let data = []
    log.debug('arranging data')

    for (const employee of employees) {
        for (var day = 1; day <= moment(params.from).daysInMonth(); day++) {
            let date = moment(params.from).set('date', day).toDate()

            let leaveSummary = leaveService.getDaySummary(employee.leaves, date, context)

            let dayStatus = getDaySummary(employee, leaveSummary, employee.attendances, date, context)
            let inOuts = getInOuts(dayStatus.attendance)

            let row = {
                date: moment(date).format('YYYY-MM-DD'),

                checkIn: inOuts.checkIn,
                checkOut: inOuts.checkOut,
                in1: inOuts.pass1.in,
                out1: inOuts.pass1.out,
                in2: inOuts.pass2.in,
                out2: inOuts.pass2.out,

                clocked: dayStatus.clocked,
                shift: dayStatus.code,
                late: dayStatus.late,
                early: dayStatus.early,

                first: dayStatus.first,
                second: dayStatus.second,
                count: dayStatus.count,
                comment: leaveSummary.reason
            }

            if (day === 1) {
                row.serialNo = serialNo
                row.code = employee.displayCode || employee.code
                row.name = employee.name
            }

            data.push(row)
        }
        data.push({})
        serialNo = serialNo + 1
    }

    log.end()

    return data
}

exports.headers = async (params, context) => {
    return [
        { label: 'S.No.', key: 'serialNo' },
        { label: 'Code', key: 'code' },
        { label: 'Name', key: 'name' },
        { label: 'Date', key: 'date' },
        { label: 'Check In', key: 'checkIn' },
        { label: 'Out Time 1', key: 'out1' },
        { label: 'In Time 2', key: 'in1' },
        { label: 'Out Time 2', key: 'out2' },
        { label: 'In Time 3', key: 'in2' },
        { label: 'Check Out', key: 'checkOut' },
        { label: 'Hours', key: 'clocked' },
        { label: 'Half 1', key: 'first' },
        { label: 'Half 2', key: 'second' },
        { label: 'Shift', key: 'shift' },
        { label: 'Late', key: 'late' },
        { label: 'Early', key: 'early' },
        { label: 'Count', key: 'count' },
        { label: 'Comment', key: 'comment' }
    ]
}

exports.format = async (params, context) => {
    let narrow = {
        width: 5.0,
        value: {
            align: 'center'
        }
    }
    let wide = {
        width: 20.0
    }

    let medium = {
        width: 8.0,
        value: {
            align: 'center'
        }
    }
    return {
        xlsx: {
            sheet: 'Attendances',
            styles: {
                headers: {},
                values: {},
                serialNo: {
                    width: 5.0,
                    value: {
                        border: null,
                        font: { sz: '10', bold: true },
                        align: 'center'
                    }
                },
                code: { value: { border: null, font: { sz: '10', bold: true } } },
                name: {
                    width: 20.0,
                    value: { border: null, font: { sz: '10', bold: true } }
                },
                checkIn: medium,
                checkOut: medium,
                in1: medium,
                in2: medium,
                out1: medium,
                out2: medium,

                first: narrow,
                second: narrow,
                early: narrow,
                late: narrow,
                count: narrow,
                clocked: narrow,
                comment: wide

            },
            reportHeader: (sheet) => {
                // format
                sheet.merge({ col: 1, row: 1 }, { col: 18, row: 2 })
                sheet.width(1, 18)
                sheet.font(1, 1, { bold: 'true', sz: '20' })
                sheet.align(1, 1, 'center')
                sheet.border(1, 1, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                sheet.fill(1, 1, { type: 'solid', fgColor: '8', bgColor: '64' })

                // content
                sheet.set(1, 1, `${context.organization.name.toUpperCase()}`)

                return 2
            }
        }
    }
}
