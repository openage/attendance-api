'use strict'
const moment = require('moment')
const formatter = require('../formatters/monthly-details-2')
// const formatter = require('../formatters/detail-attendance-report')
const db = require('../models')
const dates = require('../helpers/dates')
const timeLogService = require('../services/time-logs')
const monthlySummaryService = require('../services/monthly-summaries')

const getInOuts = (attendance, context) => {
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
        pass3: {
            out: '',
            in: ''
        },
        pass4: {
            out: '',
            in: ''
        },
        checkOut: ''
    }

    if (!attendance) {
        return values
    }

    if (attendance.checkOut) {
        values.checkOut = moment(attendance.checkOut).format('h:mm A')
    }

    if (attendance.checkIn) {
        values.checkIn = moment(attendance.checkIn).format('h:mm A')
    }

    let passes = timeLogService.getPasses(attendance, context)

    if (passes[0]) {
        if (passes[0].out) {
            values.pass1.out = passes[0].out.time
        }
        if (passes[0].in) {
            values.pass1.in = passes[0].in.time
        }
    }

    if (passes[1]) {
        if (passes[1].out) {
            values.pass2.out = moment(passes[1].out.time).format('HH:mm')
        }
        if (passes[1].in) {
            values.pass2.in = moment(passes[1].in.time).format('HH:mm')
        }
    }

    if (passes[2]) {
        if (passes[2].out) {
            values.pass3.out = moment(passes[2].out.time).format('HH:mm')
        }
        if (passes[2].in) {
            values.pass2.in = moment(passes[2].in.time).format('HH:mm')
        }
    }

    if (passes[3]) {
        if (passes[3].out) {
            values.pass4.out = moment(passes[3].out.time).format('HH:mm')
        }
        if (passes[3].in) {
            values.pass4.in = moment(passes[3].in.time).format('HH:mm')
        }
    }
    return values
}

const getData = async (params, context) => {
    params.dates = params.dates || {}
    params.dates.from = params.dates.from || new Date()
    let log = context.logger.start('getData')
    let monthlysummary = await monthlySummaryService.search(params, {
        columns: []
    }, context)
    let employees = monthlysummary.items

    const lastDay = moment(params.dates.from).daysInMonth()

    let data = []
    log.silly('arranging data')
    for (let id of employees) {
        let employee = await db.monthSummary.findById(id)

        let item = {
            code: employee.employeeModel.code,
            biometricCode: employee.employeeModel.biometricCode,
            name: employee.employeeModel.name,
            rows: []
        }
        employee.attendances = employee.attendances || []
        for (var day = 1; day <= lastDay; day++) {
            let date = moment(params.dates.from).set('date', day).toDate()
            let attendance = employee.attendances.find(i => dates.date(i.ofDate).isSame(date))
            let row = {
                date: moment(date).format('DD')
            }
            if (attendance) {
                let inOuts = getInOuts(attendance, context)
                row = {
                    date: moment(date).format('DD'),
                    shift: (attendance.shift && attendance.shift.shiftType) && attendance.shift.shiftType.code,
                    status: attendance.status,
                    checkIn: inOuts.checkIn,
                    checkOut: inOuts.checkOut,
                    totalHours: '00:00',
                    out1: (inOuts.pass1 && inOuts.pass1.out) ? moment(inOuts.pass1.out).format('h:mm A') : '--:--',
                    in1: (inOuts.pass1 && inOuts.pass1.in) ? moment(inOuts.pass1.in).format('h:mm A') : '--:--',
                    breakTime: '00:00',
                    netHours: dates.minutes(attendance.minutes).toString(),
                    comment: (employee.leave && employee.leave.reason) ? employee.leave.reason : ''
                }
                if (row.checkIn && row.checkOut) {
                    let checkin = moment(attendance.checkIn, 'HH:mm:ss')
                    let checkout = moment(attendance.checkOut, 'HH:mm:ss')
                    let mins = moment.utc(moment(checkout, 'HH:mm:ss').diff(moment(checkin, 'HH:mm:ss'))).format('mm')
                    row.totalHours = checkout.diff(checkin, 'hours') + ':' + mins
                }
                if (inOuts.pass1 && inOuts.pass1.out && inOuts.pass1.in) {
                    let breakin = moment(inOuts.pass1.out, 'HH:mm:ss')
                    let breakout = moment(inOuts.pass1.in, 'HH:mm:ss')
                    let mints = moment.utc(moment(breakout, 'HH:mm:ss').diff(moment(breakin, 'HH:mm:ss'))).format('mm')
                    row.breakTime = breakout.diff(breakin, 'hours') + ':' + mints
                }
            }

            item.rows.push(row)
        }
        data.push(item)
    }

    log.end()

    return data
}

module.exports = async (params, context) => {
    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`
    params.report = true
    let monthlysummary = await getData(params, context)
    let employees = monthlysummary

    let ofDate = params.dates && params.dates.from ? params.dates.from : new Date()

    await formatter.build(fileName, ofDate, employees, context)

    return Promise.resolve({
        fileName: fileName
    })
}
