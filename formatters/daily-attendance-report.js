const _ = require('underscore')
const moment = require('moment')
const excelBuilder = require('msexcel-builder')
const reports = require('../helpers/reports')
const logger = require('@open-age/logger')('daily-attendance-report')

const build = async (fileName, ofDate, getExtraHours, employees, organizationName) => {
    const log = logger.start('build')

    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = employees.length
    var totalRows = totalEmployees + 3
    var sheet1 = workbook.createSheet('Attendence', 17 * totalEmployees, totalRows)
    log.info('sheet1 created')
    var summaryOf = moment(ofDate).startOf('month').format('MMMM Do')

    sheet1.font(4, 1, {
        name: 'Impact',
        bold: 'true',
        sz: '24'
    })
    sheet1.set(4, 1, `${organizationName}`)

    sheet1.font(1, 2, {
        bold: 'true'
    })
    sheet1.set(1, 2, `Date`)

    sheet1.font(4, 2, {
        bold: 'true'
    })
    sheet1.set(4, 2, `${moment(ofDate).format('MMMM Do YYYY')}`)

    sheet1.font(1, 3, {
        bold: 'true'
    })
    sheet1.set(1, 3, `Code`)
    sheet1.font(2, 3, {
        bold: 'true'
    })
    sheet1.set(2, 3, `Name`)
    sheet1.font(3, 3, {
        bold: 'true'
    })
    sheet1.set(3, 3, `Designation`)
    sheet1.font(4, 3, {
        bold: 'true'
    })
    sheet1.set(4, 3, `Department`)
    sheet1.font(5, 3, {
        bold: 'true'
    })
    sheet1.set(5, 3, `Shift-Type`)
    sheet1.font(6, 3, {
        bold: 'true'
    })
    sheet1.set(6, 3, `CheckIn`)
    sheet1.font(7, 3, {
        bold: 'true'
    })
    sheet1.set(7, 3, `CheckOut`)
    sheet1.font(8, 3, {
        bold: 'true'
    })
    sheet1.set(8, 3, `Status`)
    sheet1.font(9, 3, {
        bold: 'true'
    })
    sheet1.set(9, 3, `Hours Worked`)
    if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
        sheet1.font(10, 3, {
            bold: 'true'
        })
        sheet1.set(10, 3, `Shift Hours`)
        sheet1.font(11, 3, {
            bold: 'true'
        })
        sheet1.set(11, 3, `Extra Hours`)
    }
    if (getExtraHours.byShiftLength) {
        sheet1.font(12, 3, {
            bold: 'true'
        })
        sheet1.set(12, 3, 'Short Hours')
    }

    let count = 4

    log.info('starting injecting data into sheet1')
    await Promise.each(employees, data => {
        let hourDetails
        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            if (data.attendance) {
                data.attendance.getExtraHours = getExtraHours
                hourDetails = reports.extraWorkDetails(data.attendance)
            }
        }
        sheet1.set(1, count, `${data.code || 'NA'}`)
        sheet1.set(2, count, `${data.name || 'NA'}`)
        sheet1.set(3, count, `${data.designation || 'NA'}`)
        sheet1.set(4, count, `${data.department || 'NA'}`)
        sheet1.set(5, count, `${data.attendance.shift.shiftType.name || 'NA'}`)

        sheet1.set(6, count, `${data.attendance
            ? data.attendance.checkIn ? moment(data.attendance.checkIn).format('h:mm') : 'NA'
            : 'NA'}`)

        sheet1.set(7, count, `${data.attendance
            ? data.attendance.checkOut ? moment(data.attendance.checkOut).format('h:mm') : 'NA'
            : 'NA'}`)

        sheet1.set(8, count, `${data.attendance
            ? data.attendance.status ? data.attendance.status.charAt().toUpperCase() == 'C' ? 'MISSSWIPE' : data.attendance.status.toUpperCase() : 'NA'
            : 'NA'}`)

        sheet1.set(9, count, `${data.attendance ? data.attendance.hoursWorked
            ? data.attendance.hoursWorked + 'h' + ' ' + data.attendance.minsWorked + 'm' : 'NA'
            : 'NA'}`)
        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            sheet1.set(10, count, data.attendance ? `${hourDetails.shiftHours || 'NA'}` : 'NA')

            if (data.attendance) {
                if (hourDetails.extraHours || hourDetails.extraMinutes) {
                    sheet1.set(11, count, data.attendance ? `${hourDetails.extraHours}h  ${hourDetails.extraMinutes}m` : 'NA')
                } else {
                    sheet1.set(11, count, `NA`)
                }
            } else {
                sheet1.set(11, count, `NA`)
            }

            if (getExtraHours.byShiftLength) {
                if (data.attendance) {
                    if (data.attendance.hoursWorked || data.attendance.minsWorked) {
                        sheet1.set(12, count, (hourDetails.shortHours || hourDetails.shortMinutes) ? `${hourDetails.shortHours}h  ${hourDetails.shortMinutes}m` : 'NA')
                    } else {
                        sheet1.set(12, count, `NA`)
                    }
                } else {
                    sheet1.set(12, count, `NA`)
                }
            }
        }
        count++
    })

    workbook.save((err) => {
        if (!err) {
            log.info('congratulations, your workbook created')
            return Promise.resolve({
                isCreated: true,
                message: 'attendance sheet successfully created'
            })
        }
        workbook.cancel()
        return Promise.reject(new Error('attendance sheet not created'))
    })
}

exports.build = build
