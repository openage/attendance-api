const _ = require('underscore')
const moment = require('moment')
const reports = require('../helpers/reports')
const excelBuilder = require('msexcel-builder')
const logger = require('@open-age/logger')('monthly-attendance-report')

const getGoesEarly = (attendance, shiftType) => {
    if (!attendance.checkOut) {
        return 'NA'
    }

    let endTime = moment(attendance.shift.shiftType.endTime)
    let shiftEndTime = moment(attendance.shift.date)
        .set('hour', endTime.hour())
        .set('minute', endTime.minute())
        .set('second', endTime.second())
        .set('millisecond', 0)

    const differenceInMin = moment(shiftEndTime).diff(attendance.checkOut, 'minutes')
    const differenceInHr = moment(shiftEndTime).diff(attendance.checkOut, 'hours')

    return (differenceInMin < 0) ? 'NA' : `${differenceInHr} : ${differenceInMin % 60}`
}

const getCheckout = (attendance) => {
    return `${attendance.checkOut ? moment(attendance.checkOut).format('HH:mm') : 'NA'}`
}

const build = async (fileName, ofDate, getExtraHours, employees, orgDetails) => {
    const log = logger.start('build')
    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = employees.length
    let rowNo = 4
    let columnNo = 1
    let serialNo = 1
    var sheet1 = workbook.createSheet('Attendances', 10, totalEmployees * 40)
    log.info('sheet1 created')

    sheet1.merge({ col: 1, row: 1 }, { col: 7, row: 2 })
    sheet1.width(1, 10)
    sheet1.font(1, 1, { bold: 'true', sz: '20' })
    sheet1.align(1, 1, 'center')
    sheet1.border(1, 1, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.fill(1, 1, { type: 'solid', fgColor: '8', bgColor: '64' })
    sheet1.set(1, 1, `${orgDetails.orgName.toUpperCase()}`)

    sheet1.width(1, 12.0)
    sheet1.font(1, 3, { sz: '10', bold: true })
    sheet1.align(1, 3, 'center')
    sheet1.border(1, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(1, 3, 'S.No.')
    sheet1.width(2, 12.0)
    sheet1.font(2, 3, { sz: '10', bold: true })
    sheet1.align(2, 3, 'center')
    sheet1.border(2, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(2, 3, 'Empcode')
    sheet1.width(3, 20.0)
    sheet1.font(3, 3, { sz: '10', bold: true })
    sheet1.align(3, 3, 'center')
    sheet1.border(3, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(3, 3, 'EmpName')
    sheet1.width(4, 12.0)
    sheet1.font(4, 3, { sz: '10', bold: true })
    sheet1.align(4, 3, 'center')
    sheet1.border(4, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(4, 3, 'PunchDate')
    sheet1.width(5, 12.0)
    sheet1.font(5, 3, { sz: '10', bold: true })
    sheet1.align(5, 3, 'center')
    sheet1.border(5, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(5, 3, 'ShiftCode')
    sheet1.width(6, 12.0)
    sheet1.font(6, 3, { sz: '10', bold: true })
    sheet1.align(6, 3, 'center')
    sheet1.border(6, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(6, 3, 'OutPunch')
    sheet1.width(7, 12.0)
    sheet1.font(7, 3, { sz: '10', bold: true })
    sheet1.align(7, 3, 'center')
    sheet1.border(7, 3, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
    sheet1.set(7, 3, 'Early')

    await Promise.each(employees, async (employee) => {
        log.info(`injecting data of ${employee.name} in sheet`)
        var addRow = false
        for (var date = 1; date <= moment(ofDate).daysInMonth(); date++) {
            log.info(`processing date ${moment(ofDate).set('date', date).toDate()}`)
            let attendance = null
            if (employee.monthLog) {
                attendance = reports.getAttendanceByOfDate(date, employee.monthLog.attendances)
            }
            if (attendance) {
                const goesEarly = getGoesEarly(attendance, attendance.shift.shiftType)
                if (goesEarly === 'NA') {
                    columnNo = 1
                } else {
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'center')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, serialNo)
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'left')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, `${employee.code}`)
                    sheet1.width(columnNo, 20.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'left')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, `${employee.name}`)
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'left')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, moment(ofDate).set('date', date).format('YYYY-MM-DD'))
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'left')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, `${attendance.shift.shiftType.code.toUpperCase() || 'NA'}`)
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'center')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, getCheckout(attendance))
                    sheet1.width(columnNo, 12.0)
                    sheet1.font(columnNo, rowNo, { sz: '10' })
                    sheet1.align(columnNo, rowNo, 'center')
                    sheet1.border(columnNo, rowNo, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                    sheet1.set(columnNo++, rowNo, goesEarly)
                    columnNo = 1
                    rowNo++
                    serialNo++
                    addRow = true
                }
            } else {
                columnNo = 1
            }
        }
        if (addRow) {
            rowNo = rowNo + 1
        }
        serialNo = 1
    })

    return new Promise((resolve, reject) => {
        workbook.save(function (err) {
            if (!err) {
                log.info('congratulations, your workbook created')
                return resolve({
                    isCreated: true,
                    message: 'attendance sheet successfully created'
                })
            }
            workbook.cancel()
            return reject(new Error('attendance sheet not created'))
        })
    })
}

exports.build = build
