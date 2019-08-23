const moment = require('moment')
const reports = require('../helpers/reports')
const excelBuilder = require('msexcel-builder')
const logger = require('@open-age/logger')('monthly-attendance-report')

const build = async (fileName, ofDate, getExtraHours, attendances, orgDetails) => {
    const log = logger.start('build')
    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = attendances.length
    var colomsUsed = 0
    var coloumn = 1
    var rowsUsed = 0
    var sheet1 = workbook.createSheet('Attendences', 40, 6 + totalEmployees * 15)
    log.info('sheet1 created')
    var summaryOf = moment(ofDate).startOf('month').format('MMMM YYYY')

    sheet1.width(1, 11)

    sheet1.font(14, 1, {
        bold: 'true',
        sz: '24'
    })
    sheet1.align(14, 1, 'center')
    sheet1.set(14, 1, `${orgDetails.orgName}`)

    sheet1.font(14, 3, {
        bold: 'true'
    })
    sheet1.align(14, 3, 'center')
    sheet1.set(14, 3, `Monthly Performance Report`)

    sheet1.font(14, 4, {
        bold: 'true'
    })
    sheet1.align(14, 4, 'center')
    sheet1.set(14, 4, `${summaryOf}`)

    sheet1.font(25, 1, {
        bold: 'true'
    })
    sheet1.align(25, 1, 'left')
    sheet1.align(25, 1, 'bottom')
    sheet1.set(25, 1, `Dated:${moment().format('DD-MM-YYYY')}`)

    if (orgDetails.downloaderName) {
        sheet1.font(25, 2, {
            bold: 'true'
        })
        sheet1.align(25, 2, 'left')
        sheet1.set(25, 2, `Download by:-${orgDetails.downloaderName}`)
    }

    if (orgDetails.downloaderEmail) {
        sheet1.font(25, 3, {
            bold: 'true'
        })
        sheet1.align(25, 3, 'left')
        sheet1.set(25, 3, `${orgDetails.downloaderEmail}`)
    }

    if (orgDetails.downloaderPhone) {
        sheet1.font(25, 4, {
            bold: 'true'
        })
        sheet1.align(25, 4, 'left')
        sheet1.set(25, 4, `${orgDetails.downloaderPhone}`)
    }

    log.info('starting injecting data into sheet1')
    await Promise.each(attendances, data => {
        sheet1.font(1, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(1, 6 + rowsUsed, `EmpCode:${data.employee.code}`)

        sheet1.font(3, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(3, 6 + rowsUsed, `EmpName:${data.employee.name}`)

        sheet1.font(9, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(9, 6 + rowsUsed, `Designation:${data.employee.designation}`)

        sheet1.font(16, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(16, 6 + rowsUsed, `Present:${data.monthLog ? data.monthLog.attendanceCount : 0}`)

        let onDuty = 0
        let paidLeave = 0
        let lossOfPay = 0

        if (data.leaves && data.leaves.length) {
            Promise.each(data.leaves, leave => {
                if (!leave.leaveType) {
                    return
                }
                if (leave.leaveType.category === 'OnDuty') {
                    onDuty++
                }
                if (leave.leaveType.category === 'paidLeave') {
                    onDuty++
                }
                if (leave.leaveType.category === 'lossOfPay') {
                    paidLeave++
                }
            })
        }

        sheet1.font(19, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(19, 6 + rowsUsed, `onDuty:${onDuty}`)

        sheet1.font(22, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(22, 6 + rowsUsed, `paidLeaves:${paidLeave}`)

        sheet1.font(25, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.set(25, 6 + rowsUsed, `lossOfPay:${lossOfPay}`)

        sheet1.font(28, 6 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        if (data.monthLog === null) {
            data.monthLog = 0
        }
        if (data.monthLog && data.monthLog.hoursWorked) {
            sheet1.set(28, 6 + rowsUsed, `HoursWorked:${data.monthLog ? Math.trunc(data.monthLog.hoursWorked) : 'NA'}h ${data.monthLog ? Math.trunc((data.monthLog.hoursWorked % 1) * 60) : 'NA'}m`)
        } else {
            sheet1.set(28, 6 + rowsUsed, `HoursWorked:${data.monthLog ? Math.trunc(data.monthLog.hoursWorked) : 'NA'}`)
        }

        sheet1.font(1, 7 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.font(1, 8 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.font(1, 9 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.font(1, 10 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })
        sheet1.font(1, 11 + rowsUsed, {
            bold: 'true',
            sz: '10'
        })

        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            sheet1.font(1, 12 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
            sheet1.font(1, 13 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
            sheet1.font(1, 14 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
            sheet1.font(1, 15 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
        }

        sheet1.set(1, 7 + rowsUsed, `Date`)
        sheet1.set(1, 8 + rowsUsed, `IN`)
        sheet1.set(1, 9 + rowsUsed, `OUT`)
        sheet1.set(1, 10 + rowsUsed, `STATUS`)
        sheet1.set(1, 11 + rowsUsed, `HOURS`)
        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            sheet1.set(1, 12 + rowsUsed, `SHIFT HOURS`)
            sheet1.set(1, 13 + rowsUsed, `SHIFT TYPE`)
            sheet1.set(1, 14 + rowsUsed, `EXTRA HOURS`)
        }
        if (getExtraHours.byShiftLength) {
            sheet1.set(1, 15 + rowsUsed, `SHORT HOURS`)
        }

        for (var date = 1; date <= moment(ofDate).daysInMonth(); date++) {
            sheet1.width(1 + date, 4.0)
            let hourDetails
            let attendance = null
            if (data.monthLog && data.monthLog.attendances) { attendance = reports.getAttendanceByOfDate(date, data.monthLog.attendances) }
            if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
                if (attendance) {
                    attendance.getExtraHours = getExtraHours
                    hourDetails = reports.extraWorkDetails(attendance)
                }
            }
            sheet1.font(1 + date, 7 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
            sheet1.font(1 + date, 8 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 9 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 10 + rowsUsed, {
                bold: 'true',
                sz: '10'
            })
            sheet1.font(1 + date, 11 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 12 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 13 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 14 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.font(1 + date, 15 + rowsUsed, {
                bold: 'true',
                sz: '7'
            })
            sheet1.set(1 + date, 7 + rowsUsed, `${date}`)

            if (attendance) {
                sheet1.set(1 + date, 8 + rowsUsed, `${attendance.checkIn ? moment(attendance.checkIn).format('HH:mm') : 'NA'}`)
                sheet1.set(1 + date, 9 + rowsUsed, `${attendance.checkOut ? moment(attendance.checkOut).format('HH:mm') : 'NA'}`)

                if (!attendance.shift || !attendance.shift.status) {
                    sheet1.set(1 + date, 10 + rowsUsed, `${attendance.status.charAt(0).toUpperCase() || 'NA'}`)
                } else if (attendance.shift.status === 'working') {
                    sheet1.set(1 + date, 10 + rowsUsed, `${attendance.status.charAt(0).toUpperCase() || 'NA'}`)
                } else {
                    sheet1.set(1 + date, 10 + rowsUsed, `${attendance.shift.status.charAt(0).toUpperCase() || 'NA'}`)
                }
                if (attendance.hoursWorked) {
                    sheet1.set(1 + date, 11 + rowsUsed, `${attendance.hoursWorked}h${attendance.minsWorked || '0'}m`)
                } else if (!attendance.hoursWorked && attendance.minsWorked) {
                    sheet1.set(1 + date, 11 + rowsUsed, `${attendance.minsWorked || '0'}m`)
                } else {
                    sheet1.set(1 + date, 11 + rowsUsed, `${attendance.hoursWorked || 'NA'}`)
                }

                if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
                    sheet1.set(1 + date, 12 + rowsUsed, `${hourDetails.shiftHours || 'NA'}`)
                    if (attendance.shift && attendance.shift.shiftType) {
                        sheet1.set(1 + date, 13 + rowsUsed, `${attendance.shift.shiftType.code || 'NA'}`)
                    } else {
                        sheet1.set(1 + date, 13 + rowsUsed, 'NA')
                    }
                    if (hourDetails.extraHours || hourDetails.extraMinutes) {
                        sheet1.set(1 + date, 14 + rowsUsed, `${hourDetails.extraHours}h${hourDetails.extraMinutes}m`)
                    } else {
                        sheet1.set(1 + date, 14 + rowsUsed, `NA`)
                    }
                }
                if (getExtraHours.byShiftLength) {
                    (hourDetails.shortHours || hourDetails.shortMinutes) ? sheet1.set(1 + date, 15 + rowsUsed, `${hourDetails.shortHours}h${hourDetails.shortMinutes}m`) : sheet1.set(1 + date, 15 + rowsUsed, `${'NA'}`)
                }
            } else {
                sheet1.set(1 + date, 8 + rowsUsed, `NA`)
                sheet1.set(1 + date, 9 + rowsUsed, `NA`)
                sheet1.set(1 + date, 10 + rowsUsed, `A`)
                sheet1.set(1 + date, 11 + rowsUsed, `${'NA'}`)
                if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
                    sheet1.set(1 + date, 12 + rowsUsed, `${'NA'}`)
                    sheet1.set(1 + date, 13 + rowsUsed, `${'NA'}`)
                    sheet1.set(1 + date, 14 + rowsUsed, `${'NA'}`)
                }
                if (getExtraHours.byShiftLength) {
                    sheet1.set(1 + date, 15 + rowsUsed, `${'NA'}`)
                }
            }
        }

        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            rowsUsed = rowsUsed + 12
        } else {
            rowsUsed = rowsUsed + 7
        }
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
