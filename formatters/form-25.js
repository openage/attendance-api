const _ = require('underscore')
const moment = require('moment')
const reports = require('../helpers/reports')
const excelBuilder = require('msexcel-builder')
const logger = require('@open-age/logger')('form-25')

const db = require('../models')

const leaveTypeService = require('../services/leave-types')

const buildHeader = (sheet1, date, context) => {
    sheet1.merge({
        col: 1,
        row: 1
    }, {
            col: 38,
            row: 2
        })
    sheet1.width(1, 10)
    sheet1.font(1, 1, {
        bold: 'true',
        sz: '20'
    })
    sheet1.align(1, 1, 'center')
    sheet1.border(1, 1, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.fill(1, 1, {
        type: 'solid',
        fgColor: '8',
        bgColor: '64'
    })
    sheet1.set(1, 1, `${context.organization.name.toUpperCase()}`)
    sheet1.font(1, 2, {
        bold: 'true'
    })

    sheet1.set(1, 3, `Date`)

    sheet1.font(2, 3, {
        bold: 'true'
    })
    sheet1.set(2, 3, `${moment(date).format('MMMM, YYYY')}`)
}

const setColumnHeader = (sheet1, titleColumn, text, width, vertical) => {
    sheet1.merge({
        col: titleColumn,
        row: 6
    }, {
            col: titleColumn,
            row: 7
        })
    sheet1.width(titleColumn, width)
    sheet1.font(titleColumn, 6, {
        sz: '10'
    })
    if (vertical) {
        sheet1.rotate(titleColumn, 6, 90)
    }
    sheet1.valign(titleColumn, 7, 'center')
    sheet1.border(titleColumn, 6, {
        left: 'thin',
        top: 'thin',
        right: 'thin'
    })
    sheet1.border(titleColumn, 7, {
        left: 'thin',
        bottom: 'thin',
        right: 'thin'
    })
    sheet1.set(titleColumn, 6, text)
}

const setDayHeader = (sheet1, titleColumn, day) => {
    sheet1.merge({
        col: titleColumn,
        row: 6
    }, {
            col: titleColumn + 1,
            row: 6
        })
    sheet1.width(titleColumn, 8.0)
    sheet1.font(titleColumn, 6, {
        sz: '10'
    })
    sheet1.border(titleColumn, 6, {
        left: 'thin',
        top: 'thin',
        bottom: 'thin'
    })
    sheet1.border(titleColumn + 1, 6, {
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.align(titleColumn, 6, 'center')
    sheet1.set(titleColumn, 6, `${day}`)

    sheet1.width(titleColumn, 4.0)
    sheet1.font(titleColumn, 7, {
        sz: '10'
    })
    sheet1.border(titleColumn, 7, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.valign(titleColumn, 7, 'center')
    sheet1.rotate(titleColumn, 7, 90)
    sheet1.set(titleColumn, 7, `1st Period`)

    sheet1.width(titleColumn + 1, 4.0)
    sheet1.font(titleColumn + 1, 7, {
        sz: '10'
    })
    sheet1.border(titleColumn + 1, 7, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.valign(titleColumn + 1, 7, 'center')
    sheet1.rotate(titleColumn + 1, 7, 90)
    sheet1.set(titleColumn + 1, 7, `2nd Period`)
}

const setData = (sheet1, columnNo, rowNo, text) => {
    sheet1.font(columnNo, rowNo, {
        sz: '10'
    })
    sheet1.align(columnNo, rowNo, 'left')
    sheet1.border(columnNo, rowNo, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.set(columnNo++, rowNo, text)
}
const buildColumnHeaders = async (sheet1, date, context) => {
    const lastDay = moment(date).daysInMonth()
    let columns = {
        serialNo: 1,
        employee: {
            name: 2,
            father: 3,
            code: 4,
            pf: 5,
            esi: 6,
            designation: 7,
            // department: 8,
            natureOfWork: 8
        },
        days: [],
        summary: {
            workedDays: 0,
            notWorkedDays: 0,
            absentDays: 0
        },
        leaves: [],
        remarks: 0
    }
    setColumnHeader(sheet1, columns.serialNo, `Serial No In System`, 4.0, true)
    setColumnHeader(sheet1, columns.employee.name, `Name & Residential Address`, 35.0)
    setColumnHeader(sheet1, columns.employee.father, `Fathers/Husband Name`, 35.0)
    setColumnHeader(sheet1, columns.employee.code, `Cerifying Surgeons Certification No./Code`, 20.0)
    setColumnHeader(sheet1, columns.employee.pf, `Provident Fund No.`, 20.0)
    setColumnHeader(sheet1, columns.employee.esi, `Insurance No`, 20.0)
    setColumnHeader(sheet1, columns.employee.designation, `Designation`, 20.0)
    setColumnHeader(sheet1, columns.employee.natureOfWork, `Nature Of Work`, 20.0)

    let currentColumn = 7
    for (var day = 1; day <= lastDay; day++) {
        currentColumn = currentColumn + 2
        let dayHeader = {
            day: day,
            first: currentColumn,
            second: currentColumn + 1
        }
        columns.days.push(dayHeader)
        setDayHeader(sheet1, dayHeader.first, day)
    }

    currentColumn++

    columns.summary.workedDays = ++currentColumn
    setColumnHeader(sheet1, columns.summary.workedDays, `Days Actually Worked`, 4.0, true)

    columns.summary.notWorkedDays = ++currentColumn
    setColumnHeader(sheet1, columns.summary.notWorkedDays, `Weekly Holidays Earned`, 4.0, true)

    let skipCodes = context.getConfig('reports.form-25.skip.leave-columns')

    let leaveTypes = await leaveTypeService.search({
        skipCodes: skipCodes
    }, context)

    for (const leaveType of leaveTypes) {
        let type = {
            column: ++currentColumn,
            code: leaveType.code
        }
        columns.leaves.push(type)
        setColumnHeader(sheet1, type.column, leaveType.name, 4.0, true)
    }

    columns.summary.absentDays = ++currentColumn
    setColumnHeader(sheet1, columns.summary.absentDays, `Total Days Absent`, 4.0, true)

    columns.remarks = ++currentColumn
    setColumnHeader(sheet1, columns.remarks, `Remarks`, 35.0)

    return columns
}

exports.build = async (fileName, ofDate, monthlySummaryIds, context) => {
    const log = logger.start('build')

    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = monthlySummaryIds.length

    var sheet1 = workbook.createSheet('Attendances', 100, (5 + totalEmployees) * 15)
    buildHeader(sheet1, ofDate, context)
    let columns = await buildColumnHeaders(sheet1, ofDate, context)

    let presentCodes = context.getConfig('attendance.present.codes')
    let presentDisplay = context.getConfig('attendance.present.display')
    let leaveCodes = context.getConfig('attendance.leave.codes')
    let leaveDisplay = context.getConfig('attendance.leave.display')
    let absentCodes = context.getConfig('attendance.absent.codes')
    let absentDisplay = context.getConfig('attendance.absent.display')

    var rowNo = 8
    var serialNo = 1
    log.silly('starting injecting data into sheet1')
    for (let id of monthlySummaryIds) {
        log.silly(`getting monthSummary by id: ${id.toString()}`)
        let data = await db.monthSummary.findById(id)

        setData(sheet1, columns.serialNo, rowNo, `${serialNo++}`)
        setData(sheet1, columns.employee.name, rowNo, data.employeeModel.name)
        setData(sheet1, columns.employee.father, rowNo, data.employeeModel.fatherName || 'NA')
        setData(sheet1, columns.employee.code, rowNo, data.employeeModel.code || '--')
        setData(sheet1, columns.employee.pf, rowNo, data.employeeModel.pf || 'NA')
        setData(sheet1, columns.employee.esi, rowNo, data.employeeModel.esi || 'NA')
        setData(sheet1, columns.employee.designation, rowNo, data.employeeModel.designation || 'NA')

        data.attendances = data.attendances || []

        let workedDays = 0
        let notWorkedDays = 0
        let absentDays = 0

        for (const item of columns.days) {
            let firstHalf = 'NA'
            let secondHalf = 'NA'

            let attendance = data.attendances.find(a => a.ofDate.getDate() === item.day)
            if (attendance) {
                firstHalf = attendance.firstHalfStatus ? (presentCodes.indexOf(attendance.firstHalfStatus.toUpperCase()) !== -1 ? presentDisplay : attendance.firstHalfStatus) : ''
                if ((attendance.status === 'onLeave' && (attendance.shift.status === 'working' || firstHalf.toLowerCase() === 'el')) && firstHalf !== 'P') {
                    firstHalf = leaveCodes.indexOf(attendance.firstHalfStatus.toUpperCase()) !== -1 ? leaveDisplay : attendance.firstHalfStatus
                }
                if (attendance.shift.status === 'holiday' || attendance.status === 'weekOff' || attendance.shift.status === 'weekOff') {
                    firstHalf = 'WO'
                    notWorkedDays++
                }
                if (attendance.firstHalfStatus && attendance.firstHalfStatus.toUpperCase() === 'A' && attendance.status !== 'weekOff') {
                    firstHalf = absentCodes.indexOf(attendance.firstHalfStatus.toUpperCase()) !== -1 ? absentDisplay : attendance.firstHalfStatus
                }
                if (firstHalf === presentDisplay) {
                    workedDays++
                } else if (firstHalf === absentDisplay) {
                    absentDays++
                }
                secondHalf = attendance.secondHalfStatus ? (presentCodes.indexOf(attendance.secondHalfStatus.toUpperCase()) !== -1 ? presentDisplay : attendance.secondHalfStatus) : ''
                if ((attendance.status === 'onLeave' && (attendance.shift.status === 'working' || secondHalf.toLowerCase() === 'el')) && secondHalf !== 'P') {
                    secondHalf = leaveCodes.indexOf(attendance.secondHalfStatus.toUpperCase()) !== -1 ? leaveDisplay : attendance.secondHalfStatus
                }
                if (attendance.shift.status === 'holiday' || attendance.status === 'holiday' || attendance.status === 'weekOff' || attendance.shift.status === 'weekOff') {
                    secondHalf = 'WO'
                    notWorkedDays++
                }
                if (attendance.secondHalfStatus && attendance.secondHalfStatus.toUpperCase() === 'A' && attendance.status !== 'weekOff') {
                    secondHalf = absentCodes.indexOf(attendance.secondHalfStatus.toUpperCase()) !== -1 ? absentDisplay : attendance.secondHalfStatus
                }
                if (secondHalf === presentDisplay) {
                    workedDays++
                } else if (secondHalf === absentDisplay) {
                    absentDays++
                }
                if (firstHalf === 'P') {
                    if (firstHalf !== attendance.firstHalfStatus) {
                        firstHalf = `${firstHalf}.`
                    }
                }
                if (secondHalf === 'P') {
                    if (secondHalf !== attendance.secondHalfStatus) {
                        secondHalf = `${secondHalf}.`
                    }
                }
            }

            setData(sheet1, item.first, rowNo, firstHalf)
            setData(sheet1, item.second, rowNo, secondHalf)
        }

        setData(sheet1, columns.summary.workedDays, rowNo, `${workedDays / 2 || 0}`)
        setData(sheet1, columns.summary.absentDays, rowNo, `${absentDays / 2 || 0}`)
        setData(sheet1, columns.summary.notWorkedDays, rowNo, `${notWorkedDays / 2 || 0}`)

        data.leavesSummary = data.leavesSummary || []
        for (const item of columns.leaves) {
            let leaveCount = data.leavesSummary.find(l => l.code.toLowerCase() === item.code.toLowerCase()) || {}
            setData(sheet1, item.column, rowNo, `${leaveCount.count || 0}`)
        }

        setData(sheet1, columns.remarks, rowNo, ` `)

        rowNo = rowNo + 2
    }
    return new Promise((resolve, reject) => {
        workbook.save(function (err) {
            if (!err) {
                return resolve({
                    isCreated: true,
                    message: 'sheet successfully created'
                })
            }
            workbook.cancel()
            return reject(new Error('sheet not created'))
        })
    })
}
