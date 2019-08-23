'use strict'
const moment = require('moment')
const dates = require('../helpers/dates')
const timeLogService = require('../services/time-logs')
const monthlySummaryService = require('../services/monthly-summaries')
const leaveService = require('../services/leaves')
const db = require('../models')

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
        values.checkOut = moment(attendance.checkOut).format('HH:mm')
    }

    if (attendance.checkIn) {
        values.checkIn = moment(attendance.checkIn).format('HH:mm')
    }

    let passes = timeLogService.getPasses(attendance, context)

    if (passes[0]) {
        if (passes[0].out) {
            values.pass1.out = moment(passes[0].out.time).format('HH:mm')
        }
        if (passes[0].in) {
            values.pass1.in = moment(passes[0].in.time).format('HH:mm')
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

exports.data = async (params, context) => {
    params.dates = params.dates || {}
    params.dates.from = params.dates.from || new Date()
    let log = context.logger.start('getData')

    let monthlysummary = await monthlySummaryService.search(params, {
        columns: []
    }, context)
    let employees = monthlysummary.items

    const lastDay = moment(params.dates.from).daysInMonth()

    let serialNo = 1
    let data = []
    log.silly('arranging data')
    for (let id of employees) {
        log.silly(`getting monthSummary by id: ${id.toString()}`)
        let employee = await db.monthSummary.findById(id)
        employee.attendances = employee.attendances || []
        for (var day = 1; day <= lastDay; day++) {
            let date = moment(params.dates.from).set('date', day).toDate()
            let leaveSummary = leaveService.getDaySummary(employee.leaves, date, context)
            let attendance = employee.attendances.find(i => dates.date(i.ofDate).isSame(date))

            let row = {
                date: moment(date).format('YYYY-MM-DD')
            }

            if (attendance) {
                let inOuts = getInOuts(attendance, context)

                let first = attendance.firstHalfStatus ? attendance.firstHalfStatus.toUpperCase() : 'A'
                let second = attendance.secondHalfStatus ? attendance.secondHalfStatus.toUpperCase() : 'A'
                if (attendance.shift.shiftType.status === 'holiday' || attendance.status === 'weekOff' || attendance.shift.shiftType.status === 'weekOff') {
                    first = 'WO'
                    second = 'WO'
                }

                row = {
                    date: moment(date).format('YYYY-MM-DD'),

                    checkIn: inOuts.checkIn,
                    checkOut: inOuts.checkOut,

                    in1: inOuts.pass1.in,
                    out1: inOuts.pass1.out,
                    in2: inOuts.pass2.in,
                    out2: inOuts.pass2.out,
                    in3: inOuts.pass3.in,
                    out3: inOuts.pass3.out,
                    in4: inOuts.pass4.in,
                    out4: inOuts.pass4.out,
                    clocked: dates.minutes(attendance.minutes).toString(),
                    shift: (attendance.shift && attendance.shift.shiftType) && attendance.shift.shiftType.code,
                    // late: dayStatus.late,
                    // early: dayStatus.early,

                    first: first,
                    second: second,
                    count: attendance.count,
                    comment: (leaveSummary && leaveSummary.reason) ? leaveSummary.reason : ''
                }
            }

            if (day === 1) {
                row.serialNo = serialNo
                row.code = employee.employeeModel.code
                row.biometricCode = employee.employeeModel.biometricCode
                row.name = employee.employeeModel.name
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
    return context.getConfig('reports.attendance-details.columns') || [{
        label: 'S.No.',
        key: 'serialNo'
    },
    {
        label: 'Code',
        key: 'code'
    },
    {
        label: 'Name',
        key: 'name'
    },
    {
        label: 'Date',
        key: 'date'
    },
    {
        label: 'Check In',
        key: 'checkIn'
    },
    {
        label: 'Out Time 1',
        key: 'out1'
    },
    {
        label: 'In Time 2',
        key: 'in1'
    },
    {
        label: 'Out Time 2',
        key: 'out2'
    },
    {
        label: 'In Time 3',
        key: 'in2'
    },
    {
        label: 'Check Out',
        key: 'checkOut'
    },
    {
        label: 'Hours',
        key: 'clocked'
    },
    {
        label: 'Half 1',
        key: 'first'
    },
    {
        label: 'Half 2',
        key: 'second'
    },
    {
        label: 'Shift',
        key: 'shift'
    },
    // { label: 'Late', key: 'late' },
    // { label: 'Early', key: 'early' },
    {
        label: 'Count',
        key: 'count'
    },
    {
        label: 'Comment',
        key: 'comment'
    }
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
            sheet: context.getConfig('reports.attendance-details.format.xlsx.sheet') || 'Attendances',
            styles: context.getConfig('reports.attendance-details.format.xlsx.styles') || {
                headers: {},
                values: {},
                serialNo: {
                    width: 5.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        },
                        align: 'center'
                    }
                },
                code: {
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                name: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
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
                sheet.merge({
                    col: 1,
                    row: 1
                }, {
                        col: 18,
                        row: 2
                    })
                sheet.width(1, 18)
                sheet.font(1, 1, {
                    bold: 'true',
                    sz: '20'
                })
                sheet.align(1, 1, 'center')
                sheet.border(1, 1, {
                    left: 'thin',
                    top: 'thin',
                    right: 'thin',
                    bottom: 'thin'
                })
                sheet.fill(1, 1, {
                    type: 'solid',
                    fgColor: '8',
                    bgColor: '64'
                })

                // content
                sheet.set(1, 1, `${context.organization.name.toUpperCase()}`)

                return 2
            }
        }
    }
}
