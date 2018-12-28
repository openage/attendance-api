'use strict'
const mapper = require('../mappers/attendance')
const empMapper = require('../mappers/employee')
const summaryMapper = require('../mappers/summary')
const locationMapper = require('../mappers/locatinLog')
const getDayStatus = require('../services/shifts').getDayStatus
const dbQuery = require('../helpers/querify')
const moment = require('moment')
const async = require('async')
const _ = require('underscore')
const logger = require('@open-age/logger')('attendance')
const excelBuilder = require('msexcel-builder')
const appRootPath = require('app-root-path')
const join = require('path').join
const fs = require('fs')
const updationScheme = require('../helpers/updateEntities')
const ip = require('../helpers/ip')
const offline = require('@open-age/offline-processor')
const teams = require('../services/teams')
const client = new require('node-rest-client-promise').Client()
const locationConfig = require('config').get('location')
const db = require('../models')
const attendanceService = require('../services/attendances')

const dates = require('../helpers/dates')

const paging = require('../helpers/paging')

var completeMonthAttendance = dateWiseAttendances => {
    var fullCompleteMonthLog = []
    var date = 1
    let lastItem = dateWiseAttendances.splice(-1)[0]
    let lastItemDate = moment(lastItem.ofDate).format('D')
    let monthEndDate = moment(lastItem.ofDate).endOf('month').format('D')
    dateWiseAttendances.push(lastItem)
    dateWiseAttendances.forEach(item => {
        let nowDate = moment(item.ofDate).format('D')
        for (date; date <= nowDate; date) {
            if (nowDate === date) {
                fullCompleteMonthLog.push(item)
                date++
            } else {
                fullCompleteMonthLog.push({
                    checkIn: '',
                    checkOut: '',
                    status: 'NA',
                    hoursWorked: ' ',
                    ofDate: moment().set('date', date)
                })
                date++
            }
        }
    })
    if (parseInt(lastItemDate) < parseInt(monthEndDate)) {
        lastItemDate = (parseInt(lastItemDate) + 1)
        for (lastItemDate; lastItemDate <= monthEndDate; lastItemDate++) {
            fullCompleteMonthLog.push({
                ofDate: moment().set('date', lastItemDate),
                checkIn: '',
                checkOut: '',
                status: 'NA',
                hoursWorked: ' '
            })
        }
    }
    return fullCompleteMonthLog
}

var getAttendance = (i, attendanceStats) => {
    return _.find(attendanceStats, function (attendance) {
        return moment(attendance.ofDate).date() === i
    })
}

var getExtraWorkDetails = attendance => {
    let timeDetails = {}

    if (attendance) {
        timeDetails.shiftHours = moment(
            moment(attendance.shift.shiftType.endTime).get('hour')
        ).diff(moment(moment(attendance.shift.shiftType.startTime).get('hour')))

        if (attendance.getExtraHours.byShiftEnd) {
            if (attendance.checkOut) {
                let shiftEnd = moment()
                    .set('year', moment(attendance.checkOut).year())
                    .set('month', moment(attendance.checkOut).month())
                    .set('date', moment(attendance.checkOut).date())
                    .set('hour', moment(attendance.shift.shiftType.endTime).hour())
                    .set('minute', moment(attendance.shift.shiftType.endTime).minutes())
                    .set('second', moment(attendance.shift.shiftType.endTime).seconds())
                    .set(
                        'millisecond',
                        moment(attendance.shift.shiftType.endTime).milliseconds()
                    )
                if (moment(attendance.checkOut).isAfter(moment(shiftEnd))) {
                    timeDetails.extraHours = moment(
                        moment(attendance.checkOut).get('hour')
                    ).diff(moment(moment(attendance.shift.shiftType.endTime).get('hour')))
                    timeDetails.extraMinutes = moment(
                        moment(attendance.checkOut).get('minute')
                    ).diff(
                        moment(moment(attendance.shift.shiftType.endTime).get('minute'))
                    )
                }
            }
            return timeDetails
        } else {
            let hoursWorked = attendance.hoursWorked + (attendance.minsWorked / 60)
            if (hoursWorked > timeDetails.shiftHours) {
                timeDetails.extraHours = attendance.hoursWorked - timeDetails.shiftHours
                timeDetails.extraMinutes = attendance.minsWorked
            }
            if (timeDetails.shiftHours > hoursWorked && (!hoursWorked == 0)) {
                timeDetails.shortHours = timeDetails.shiftHours - (attendance.hoursWorked + 1)
                timeDetails.shortMinutes = 60 - attendance.minsWorked
            }
            return timeDetails
        }
    }
}

var xlBuilder = (fileName, ofDate, getExtraHours, attendances, orgDetails) => {
    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = attendances.length
    var colomsUsed = 0
    var coloumn = 1
    var totalRows = 4500
    var rowsUsed = 0
    var sheet1 = workbook.createSheet('Attendences', 3100 * totalEmployees, totalRows)
    var summaryOf = moment(ofDate).startOf('month').format('MMMM YYYY')

    sheet1.width(1, 11)

    sheet1.font(14, 1, { bold: 'true', sz: '24' })
    sheet1.align(14, 1, 'center')
    sheet1.set(14, 1, `${orgDetails.orgName}`)

    // sheet1.font(14 , 2, { bold: 'true' });
    // sheet1.align(14, 2, 'center');
    // sheet1.set(14 , 2, `C-133, Phase-8a, Industrial Area, Mohali, Punjab`);

    sheet1.font(14, 3, { bold: 'true' })
    sheet1.align(14, 3, 'center')
    sheet1.set(14, 3, `Monthly Performance Report`)

    sheet1.font(14, 4, { bold: 'true' })
    sheet1.align(14, 4, 'center')
    sheet1.set(14, 4, `${summaryOf}`)

    sheet1.font(25, 1, { bold: 'true' })
    sheet1.align(25, 1, 'left')
    sheet1.align(25, 1, 'bottom')
    sheet1.set(25, 1, `Dated:${moment().format('DD-MM-YYYY')}`)

    sheet1.font(25, 2, { bold: 'true' })
    sheet1.align(25, 2, 'left')
    sheet1.set(25, 2, `Download by:-${orgDetails.downloaderName}`)

    sheet1.font(25, 3, { bold: 'true' })
    sheet1.align(25, 3, 'left')
    sheet1.set(25, 3, `${orgDetails.downloaderEmail}`)

    sheet1.font(25, 4, { bold: 'true' })
    sheet1.align(25, 4, 'left')
    sheet1.set(25, 4, `${orgDetails.downloaderPhone}`)

    attendances.forEach(data => {
        sheet1.font(1, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(1, 6 + rowsUsed, `EmpCode:${data.employee.code}`)

        sheet1.font(3, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(3, 6 + rowsUsed, `EmpName:${data.employee.name}`)

        sheet1.font(9, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(9, 6 + rowsUsed, `Designation:${data.employee.designation}`)

        sheet1.font(16, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(16, 6 + rowsUsed, `Present:${data.monthLog ? data.monthLog.attendanceCount : 0}`)

        let onDuty = 0
        let paidLeave = 0
        let lossOfPay = 0

        if (data.leaves && !_.isEmpty(data.leaves)) {
            data.leaves.forEach(leave => {
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

        sheet1.font(19, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(19, 6 + rowsUsed, `onDuty:${onDuty}`)

        sheet1.font(22, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(22, 6 + rowsUsed, `paidLeaves:${paidLeave}`)

        sheet1.font(25, 6 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.set(25, 6 + rowsUsed, `lossOfPay:${lossOfPay}`)

        sheet1.font(28, 6 + rowsUsed, { bold: 'true', sz: '10' })
        // if (data.monthLog === null) {
        //     data.monthLog == 0
        // }
        if (data.monthLog && data.monthLog.hoursWorked) {
            sheet1.set(28, 6 + rowsUsed, `HoursWorked:${data.monthLog ? Math.trunc(data.monthLog.hoursWorked) : 'NA'}h ${data.monthLog ? Math.trunc((data.monthLog.hoursWorked % 1) * 60) : 'NA'}m`)
        } else {
            sheet1.set(28, 6 + rowsUsed, `HoursWorked:${data.monthLog ? Math.trunc(data.monthLog.hoursWorked) : 'NA'}`)
        }

        sheet1.font(1, 7 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.font(1, 8 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.font(1, 9 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.font(1, 10 + rowsUsed, { bold: 'true', sz: '10' })
        sheet1.font(1, 11 + rowsUsed, { bold: 'true', sz: '10' })

        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            sheet1.font(1, 12 + rowsUsed, { bold: 'true', sz: '10' })
            sheet1.font(1, 13 + rowsUsed, { bold: 'true', sz: '10' })
            sheet1.font(1, 14 + rowsUsed, { bold: 'true', sz: '10' })
            sheet1.font(1, 15 + rowsUsed, { bold: 'true', sz: '10' })
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
            if (data.monthLog && data.monthLog.attendances) { attendance = getAttendance(date, data.monthLog.attendances) }
            if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
                if (attendance) {
                    attendance.getExtraHours = getExtraHours
                    hourDetails = getExtraWorkDetails(attendance)
                }
            }
            sheet1.font(1 + date, 7 + rowsUsed, { bold: 'true', sz: '10' })
            sheet1.font(1 + date, 8 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 9 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 10 + rowsUsed, { bold: 'true', sz: '10' })
            sheet1.font(1 + date, 11 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 12 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 13 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 14 + rowsUsed, { bold: 'true', sz: '7' })
            sheet1.font(1 + date, 15 + rowsUsed, { bold: 'true', sz: '7' })
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
                console.log('congratulations, your workbook created')
                return resolve({ isCreated: true, message: 'attendance sheet successfully created' })
            }
            workbook.cancel()
            return reject(new Error('attendance sheet not created'))
        })
    })
}

var xlBuilderSingleDay = (fileName, ofDate, getExtraHours, employees, organizationName) => {
    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = employees.length
    var totalRows = totalEmployees + 3
    var sheet1 = workbook.createSheet('Attendence', 17 * totalEmployees, totalRows)
    var summaryOf = moment(ofDate).startOf('month').format('MMMM Do')

    sheet1.font(4, 1, { name: 'Impact', bold: 'true', sz: '24' })
    sheet1.set(4, 1, `${organizationName}`)

    sheet1.font(1, 2, { bold: 'true' })
    sheet1.set(1, 2, `Date`)

    sheet1.font(4, 2, { bold: 'true' })
    sheet1.set(4, 2, `${moment(ofDate).format('MMMM Do YYYY')}`)

    sheet1.font(1, 3, { bold: 'true' })
    sheet1.set(1, 3, `Code`)
    sheet1.font(2, 3, { bold: 'true' })
    sheet1.set(2, 3, `Name`)
    sheet1.font(3, 3, { bold: 'true' })
    sheet1.set(3, 3, `Designation`)
    sheet1.font(4, 3, { bold: 'true' })
    sheet1.set(4, 3, `Department`)
    sheet1.font(5, 3, { bold: 'true' })
    sheet1.set(5, 3, `Shift-Type`)
    sheet1.font(6, 3, { bold: 'true' })
    sheet1.set(6, 3, `CheckIn`)
    sheet1.font(7, 3, { bold: 'true' })
    sheet1.set(7, 3, `CheckOut`)
    sheet1.font(8, 3, { bold: 'true' })
    sheet1.set(8, 3, `Status`)
    sheet1.font(9, 3, { bold: 'true' })
    sheet1.set(9, 3, `Hours Worked`)
    if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
        sheet1.font(10, 3, { bold: 'true' })
        sheet1.set(10, 3, `Shift Hours`)
        sheet1.font(11, 3, { bold: 'true' })
        sheet1.set(11, 3, `Extra Hours`)
    }
    if (getExtraHours.byShiftLength) {
        sheet1.font(12, 3, { bold: 'true' })
        sheet1.set(12, 3, 'Short Hours')
    }

    let count = 4

    employees.forEach(data => {
        let hourDetails
        if (getExtraHours.byShiftEnd || getExtraHours.byShiftLength) {
            if (data.attendance) {
                data.attendance.getExtraHours = getExtraHours
                hourDetails = getExtraWorkDetails(data.attendance)
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

    return new Promise((resolve, reject) => {
        workbook.save(function (err) {
            if (!err) {
                console.log('congratulations, your workbook created')
                return resolve({ isCreated: true, message: 'attendance sheet successfully created' })
            }
            workbook.cancel()
            return reject(new Error('attendance sheet not created'))
        })
    })
}

var dayStatus = (shiftType, date) => {
    let todayIs

    let forDate = date ? moment(date).weekday() : moment().weekday()
    switch (forDate) {
    case 0:
        todayIs = 'sunday'
        break
    case 1:
        todayIs = 'monday'
        break
    case 2:
        todayIs = 'tuesday'
        break
    case 3:
        todayIs = 'wednesday'
        break
    case 4:
        todayIs = 'thursday'
        break
    case 5:
        todayIs = 'friday'
        break
    case 6:
        todayIs = 'saturday'
        break
    }
    if (shiftType[todayIs] === 'off') {
        return 'weekOff'
    }
    return 'working'
}

exports.getCurrentDate = (req, res) => {
    let currentDate = moment().utc().toDate()
    res.data({ currentDate: currentDate })
}

exports.get = async (req) => {
    let where = {}

    let date = dates.date(req.params.id).bod()
    let employee = { id: req.query.employeeId }

    let attendance = await attendanceService.getAttendanceByDate(date, employee, req.context)
    return mapper.toModel(attendance)
}

exports.search = (req, res) => {
    let fromDate
    let toDate
    let employeeId = req.query.employee ? req.query.employee : req.employee.id

    let query = {
        employee: employeeId
    }

    if (req.query.fromDate || req.query.toDate) {
        query.ofDate = {}
    }
    if (req.query.ofDate) {
        query.ofDate = req.query.ofDate
    }

    if (req.query.fromDate) {
        fromDate = moment(req.query.fromDate)
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

        query.ofDate.$gte = fromDate
    }

    if (req.query.toDate) {
        toDate = moment(req.query.toDate)
            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

        query.ofDate.$lt = toDate
    }

    db.attendance.find(query)
        .populate({
            model: 'shift',
            path: 'shift',
            populate: {
                model: 'holiday',
                path: 'holiday'
            }
        }).sort({ ofDate: 1 })
        .then(attendances => res.page(mapper.toSearchModel(attendances)))
        .catch(err => res.failure(err))
}

exports.create = async (req) => {
    let status = 'absent'

    if (req.body.status === 'weekOff') {
        status = 'weekOff'
    }

    let date = dates.date(req.body.ofDate).bod()

    let attendance = await attendanceService.getAttendanceByDate(date, req.body.employee, req.context)

    attendance.status = status

    await attendance.save()

    let entity = await db.attendance.findById(attendance.id)
        .populate('employee timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    return mapper.toModel(entity)
}

exports.update = async (req) => {
    let attendance
    if (req.body.status === 'weekOff') {
        attendance = await attendanceService.markOffDay({ id: req.params.id }, req.context)
    }
    return mapper.toModel(attendance)
}

exports.updateByExtServer = (req, res) => {
    let employeeCode = req.params.empCode
    let ofDate = req.body.ofDate
    let model = {
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut
    }

    if (!model.checkIn) {
        if (!model.checkOut) {
            return res.failure('checkIn or checkout is required to update attendance')
        }
        delete model.checkIn
    }

    if (!model.checkOut) {
        if (!model.checkIn) {
            return res.failure('checkIn or checkout is required to update attendance')
        }
        delete model.checkOut
    }

    if (model.checkIn && model.checkOut) {
        model.status = 'present'
        model.hoursWorked = moment(model.checkOut).diff(moment(model.checkIn), 'hours') || 0
    }
    if (!model.checkIn || !model.checkOut) {
        model.hoursWorked = 0
        model.status = 'missSwipe'
    }

    let fromDate = moment(ofDate) // for perticular punchDate
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = moment(ofDate)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d

    model.ofDate = moment(ofDate)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)

    db.employee.findOne({ code: employeeCode, organization: req.context.organization })
        .populate('shiftType')
        .then(employee => {
            if (!employee) {
                throw new Error('no employee found')
            }
            if (!employee.shiftType) {
                throw new Error('no shiftType found of employee')
            }
            model.employee = employee
            return getDayStatus(employee.shiftType, ofDate)
                .then(dayData => {
                    return { dayData: dayData, employee: employee }
                })
        })
        .then(data => {
            return db.shift.findOrCreate({
                shiftType: data.employee.shiftType,
                date: {
                    $gte: fromDate,
                    $lt: toDate
                }
            }, {
                shiftType: data.employee.shiftType,
                status: data.dayData.status,
                holiday: data.dayData.holiday,
                date: moment(ofDate)
                    .set('hour', moment(data.employee.shiftType.startTime).hours())
                    .set('minute', moment(data.employee.shiftType.startTime).minutes())
                    .set('second', 0)
                    .set('millisecond', 0)._d
            })
                .then(shift => {
                    return { employee: data.employee, shift: shift.result }
                })
        })
        .then(data => {
            return db.attendance.findOrCreate({
                employee: data.employee,
                shift: data.shift
            }, model, { upsert: true })
        })
        .then(attendance => {
            // TODO: Update summaries too
            if (model.checkIn && model.checkOut) {
                attendance.employee = attendance.result.employee.toString()
            }

            return res.success('attendance successfully updated')
        })
        .catch(err => res.failure(err))
}

exports.summary = (req, res) => {
    let attendanceOf = req.params.id === 'my' ? req.employee.id : req.params.id

    let toDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')

    let forToday = moment()
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let currentYearDate = moment().startOf('year')
    // let currentWeekDate = moment().startOf('week').add(1, 'day');
    let currentWeekDate = moment().startOf('week').toDate()
    let commingSunday = moment().endOf('week').toDate()
    let currentMonthDate = moment().startOf('month').toDate()
    let endOfMonth = moment().endOf('month').toDate()

    Promise.all([
        db.yearSummary.find({ // multiple months
            employee: attendanceOf,
            endMonth: {
                $gte: currentYearDate,
                $lte: endOfMonth
            }
        }),

        db.monthSummary.find({ // multiple weeks
            employee: attendanceOf,
            weekStart: {
                $gte: currentMonthDate
            },
            weekEnd: {
                $lte: endOfMonth
            }
        })
            .populate('attendances'),

        db.weekSummary.findOne({ // current week
            employee: attendanceOf,
            weekStart: {
                $gte: currentWeekDate
            },
            weekEnd: {
                $lte: commingSunday
            }
        }).populate('attendances'),

        db.attendance.findOne({ // getting today attendance
            employee: attendanceOf,
            ofDate: {
                $gte: forToday,
                $lt: toDate
            }
        })
            .populate('recentMostTimeLog')
    ])
        .spread((tillCurrentYear, tillCurrentMonth, tillCurrentWeek, today) => {
            // months , weeks , week ,day
            return res.data(summaryMapper.toModel(tillCurrentYear, tillCurrentMonth, tillCurrentWeek, today))
        }).catch(err => res.failure(err))
}

exports.attendanceExtractor = (req, res) => {
    let organization = req.context.organization

    let query = {
        organization: global.toObjectId(organization.id),
        status: 'active'
    }

    let shiftEnd = req.query.byShiftEnd === 'true'

    let shiftLength = req.query.byShiftLength === 'true'

    let attendances = []

    let ofDate = req.query.ofDate

    let getExtraHours = {
        byShiftEnd: shiftEnd,
        byShiftLength: shiftLength
    }

    // getExtraHours = req.query.extraHours || true,

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let fileName = ofDate
        ? 'MonthlyAttendance-' + moment(ofDate).startOf('month').format('MMMM Do') + '.xlsx'
        : 'Monthly Attendance-' + moment().startOf('month').format('MMMM Do') + '.xlsx'
    var orgDetails = {
        orgName: req.context.organization.name,
        downloaderName: req.employee.name,
        downloaderEmail: req.employee.email,
        downloaderPhone: req.employee.phone
    }

    if (req.query.name) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query.tags = { $in: tagIds }
    }

    if (req.query.code) {
        query.code = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    if (req.query.shiftType) {
        query.shiftType = global.toObjectId(req.query.shiftType)
    }

    db.employee.aggregate([{
        $match: query
    }, {
        $project: { name: 1, code: 1, designation: 1 }
    }])
        .then(employees => {
            employees = employees.sort((a, b) => {
                return a.code - b.code
            })
            return Promise.each(employees, employee => {
                return Promise.all([
                    db.leave.find({
                        employee: global.toObjectId(employee._id),
                        status: 'approved',
                        date: {
                            $gte: fromDate,
                            $lt: moment()
                        }
                    }).populate('leaveType'),
                    db.monthSummary.findOne({
                        employee: employee,
                        weekStart: fromDate,
                        weekEnd: toDate
                    }).populate({
                        path: 'attendances',
                        populate: {
                            path: 'shift',
                            populate: {
                                path: 'shiftType'
                            }
                        }
                    })
                ])
                    .spread((leaves, monthLog) => {
                        return attendances.push({
                            employee: employee,
                            leaves: leaves,
                            monthLog: monthLog
                        })
                    }).catch(err => {
                        throw err
                    })
            })
        })
        .then(() => {
            return xlBuilder(fileName, ofDate, getExtraHours, attendances, orgDetails)
        })
        .then(result => {
            if (result.isCreated) {
                return res.download(join(appRootPath.path, `temp/${fileName}`), fileName, function (err) {
                    if (err) {
                        throw err
                    }
                    fs.unlink(join(appRootPath.path, `temp/${fileName}`), function (err) {
                        if (err) {
                            throw err
                        }
                    })
                })
            }
            throw result
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.attendanceMonthlyPdf = (req, res) => {
    let organization = req.context.organization

    let query = {
        organization: global.toObjectId(organization.id),
        status: 'active'
    }

    let employeesAttendance = []

    let ofDate = req.query.date

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    if (req.query.code) {
        query.code = {
            $regex: req.query.code,
            $options: 'i'
        }
    }
    db.employee.aggregate([{
        $match: query
    }, {
        $project: { name: 1, code: 1, designation: 1 }
    }])
        .then(employees => {
            employees = employees.sort((a, b) => {
                return a.code - b.code
            })
            return Promise.each(employees, employee => {
                return Promise.all([
                    db.attendance.find({
                        employee: employee,
                        status: 'onLeave',
                        ofDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }).count(),

                    db.leave.aggregate([{
                        $lookup: {
                            from: 'leaveTypes',
                            localField: 'leaveType',
                            foreignField: '_id',
                            as: 'leaveAggregate'
                        }
                    }, {
                        $match: {
                            'ofDate': {
                                $gte: fromDate._d,
                                $lte: toDate._d
                            },
                            'employee': global.toObjectId(employee._id),
                            'leaveAggregate.status': 'onDuty'
                        }
                    }]),

                    db.attendance.aggregate([{
                        $lookup: {
                            from: 'shifts',
                            localField: 'shift',
                            foreignField: '_id',
                            as: 'shiftAggregate'
                        }
                    }, {
                        $match: {
                            'ofDate': {
                                $gte: fromDate._d,
                                $lte: toDate._d
                            },
                            'employee': global.toObjectId(employee._id),
                            'shiftAggregate.status': 'holiday'
                        }
                    }]),

                    db.attendance.aggregate([{
                        $lookup: {
                            from: 'shifts',
                            localField: 'shift',
                            foreignField: '_id',
                            as: 'shiftAggregate'
                        }
                    }, {
                        $match: {
                            'ofDate': {
                                $gte: fromDate._d,
                                $lte: toDate._d
                            },
                            'employee': global.toObjectId(employee._id),
                            'shiftAggregate.status': 'weekOff'
                        }
                    }]),

                    db.attendance.aggregate([{
                        $lookup: {
                            from: 'shifts',
                            localField: 'shift',
                            foreignField: '_id',
                            as: 'shiftAggregate'
                        }
                    }, {
                        $match: {
                            'ofDate': {
                                $gte: fromDate._d,
                                $lte: toDate._d
                            },
                            'employee': global.toObjectId(employee._id),
                            'status': 'absent',
                            'shiftAggregate.status': 'working'
                        }
                    }]),

                    db.attendance.find({
                        employee: employee,
                        $or: [{ status: 'present' }, { status: 'halfday' }, { status: 'missSwipe' }],
                        ofDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }).count(),

                    db.monthSummary.findOne({
                        employee: employee,
                        weekStart: fromDate,
                        weekEnd: toDate
                    }).populate({
                        path: 'attendances',
                        populate: {
                            path: 'shift',
                            populate: {
                                path: 'shiftType'
                            }
                        }
                    }).lean()
                ])
                    .spread((leaveCount, onDutyCount, holidayCount, weekOffCount, absentCount, presentCount, monthLog) => {
                        var dateWiseAttendance = monthLog.attendances.sort((a, b) => {
                            return new Date(a.ofDate) - new Date(b.ofDate)
                        })

                        var completeMonthLog = completeMonthAttendance(dateWiseAttendance)
                        employee.attendances = completeMonthLog
                        employee.presentDays = presentCount
                        employee.leaveDays = (leaveCount - onDutyCount.length)
                        employee.onDuty = onDutyCount.length
                        employee.hoursWorked = monthLog.hoursWorked
                        employee.holiday = holidayCount.length
                        employee.weekOff = weekOffCount.length
                        employee.absentDays = absentCount.length

                        return employeesAttendance.push(summaryMapper.toPdfModel(employee))
                    }).catch(err => {
                        throw err
                    })
            })
        })

        .then(result => {
            logger.info('processed')
            var mappedModel = {}
            mappedModel.employees = employeesAttendance
            mappedModel.organization = organization
            res.page(mappedModel)
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.getMonthlySummary = (req, res) => {
    let query = {
        organization: req.context.organization,
        status: 'active'
    }

    let ofDate = req.query.ofDate

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)
    let totalRecordsCount = 0

    if (req.query.name) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    if (req.query.designation) {
        query.designation = {
            $regex: req.query.designation,
            $options: 'i'
        }
    }

    if (req.query.code) {
        query.code = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    if (req.query.shiftType) {
        query.shiftType = req.query.shiftType
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query.tags = { $in: tagIds }
    }

    Promise.all([
        db.employee.find(query).count(),
        db.employee.find(query).sort({ name: 1 })
            .select('name code designation picUrl shiftType')
            .populate('shiftType')
            .lean().skip(fromPage).limit(pageLmt)
    ])
        .spread((count, employees) => {
            totalRecordsCount = count
            Promise.mapSeries(employees, employee => {
                let leaveBalances = dbQuery.getTotalLeaveBalance(employee._id)
                let monthPresentCount = db.attendance.find({
                    employee: employee,
                    ofDate: {
                        $gte: fromDate,
                        $lt: toDate
                    },
                    status: {
                        $in: ['present', 'missSwipe', 'halfday']
                    }
                }).count()
                let absentDays = db.attendance.find({
                    employee: employee,
                    ofDate: {
                        $gte: fromDate,
                        $lt: toDate
                    },
                    status: {
                        $eq: 'absent'
                    }
                }).populate({
                    path: 'shift',
                    match: {
                        status: 'working'
                    }
                }).lean()

                return Promise.all([monthPresentCount, leaveBalances, absentDays]).spread((monthSummary, leaveBalances, absentDays) => {
                    employee.presentDays = monthSummary || 0
                    employee.absentDays = _.filter(absentDays, day => day.shift !== null).length
                    employee.leaveBalances = leaveBalances

                    return employee
                })
            }).then(employees => {
                return res.page(summaryMapper.monthlySummary(employees), pageLmt, PageNo, totalRecordsCount)
            })
        })
        .catch(err => res.failure(err))
}

const extractQuery = req => {
    let ofDate = req.query.ofDate || new Date()
    let fromDate = dates.date(ofDate).bod()
    let toDate = dates.date(ofDate).eod()

    let query = {
        'emp.status': 'active',
        'emp.organization': global.toObjectId(req.context.organization.id),
        'ofDate': {
            $gte: fromDate,
            $lt: toDate
        }
    }

    if (req.query.name) {
        query['emp.name'] = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    if (req.query.status) {
        if (req.query.status.toLowerCase() == 'present') {
            req.query.status = /present|checkedin|checked-in-again/
        }
        query.status = {
            $regex: req.query.status,
            $options: 'i'
        }
    }

    if (req.query.code) {
        query['emp.code'] = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query['emp.tags'] = { $in: tagIds }
    }

    if (req.query.shiftTypeId) {
        query['emp.shiftType'] = global.toObjectId(req.query.shiftTypeId)
    }

    return query
}

exports.regenerate = async (req) => {
    if (req.body.id) {
        let attendance = await attendanceService.reset({
            id: req.body.id
        }, {
            removeWeekOff: req.body.removeWeekOff
        }, req.context)

        return mapper.toModel(attendance)
    }

    let date = dates.date(req.query.date || req.body.date).bod()
    let period = req.query.period || req.body.period || 'day'

    await offline.queue(period === 'month' ? 'work-month' : 'day', 'regenerate', {
        date: date
    }, req.context)

    return { message: 'submitted' }
}

exports.getOneDayAttendances = async (req) => {
    let query = extractQuery(req)
    let page = paging.extract(req)

    let attendances = await db.attendance.aggregate([{
        $lookup: {
            from: 'shifts',
            localField: 'shift',
            foreignField: '_id',
            as: 'currentShift'
        }
    }, {
        $unwind: '$currentShift'
    }, {
        $lookup: {
            from: 'shifttypes',
            localField: 'currentShift.shiftType',
            foreignField: '_id',
            as: 'shiftType'
        }
    }, {
        $unwind: '$shiftType'
    }, {
        $lookup: {
            from: 'employees',
            localField: 'employee',
            foreignField: '_id',
            as: 'emp'
        }
    }, {
        $unwind: '$emp'
    }, {
        $match: query
    },
    {
        $sort: { 'emp.name': 1 }
        // }, {
        //     $unwind: {
        //         path: '$timeLogs',
        //         preserveNullAndEmptyArrays: true
        //     }
        // }, {
        //     $lookup: {
        //         from: 'timelogs',
        //         localField: 'timeLogs',
        //         foreignField: '_id',
        //         as: 'timeLogItem'
        //     }
        // }, {
        //     $unwind: {
        //         path: '$timeLogItem',
        //         preserveNullAndEmptyArrays: true
        //     }
        // }, {
        //     $group: {
        //         _id: '$_id',
        //         status: { $first: '$status' },
        //         ofDate: { $first: '$ofDate' },
        //         checkIn: { $first: '$checkIn' },
        //         checkOut: { $first: '$checkOut' },
        //         checkOutExtend: { $first: '$checkOutExtend' },
        //         hoursWorked: { $first: '$hoursWorked' },
        //         minsWorked: { $first: '$minsWorked' },
        //         units: { $first: '$units' },
        //         isGrace: { $first: '$isGrace' },
        //         employee: { $first: '$emp' },
        //         team: { $first: '$team' },
        //         shift: { $first: '$currentShift' },
        //         timeLogs: { $push: '$timeLogItem' }
        //     }
    },
    { $skip: page.skip },
    { $limit: page.limit }
    ])

    let items = attendances.map(entity => {
        var model = {
            id: entity._id,
            status: entity.status,
            checkIn: entity.checkIn,
            checkOut: entity.checkOut,
            checkOutExtend: entity.checkOutExtend,
            ofDate: entity.ofDate,
            count: entity.count,
            hoursWorked: entity.hoursWorked || 0,
            minsWorked: entity.minsWorked || 0,
            shift: {
                id: entity.currentShift._id,
                date: entity.currentShift.date,
                status: entity.currentShift.status,
                shiftType: {
                    id: entity.shiftType._id,
                    name: entity.shiftType.name,
                    code: entity.shiftType.code,
                    startTime: entity.shiftType.startTime,
                    endTime: entity.shiftType.endTime
                }
            },
            employee: {
                id: entity.emp._id,
                name: entity.emp.name,
                code: entity.emp.code,
                designation: entity.emp.designation,
                picData: entity.emp.picData,
                picUrl: entity.emp.picUrl,
                email: entity.emp.email,
                hasTeam: entity.team && entity.team.teamCount > 0
            },
            timeLogs: []
        }

        return model
    })

    let total = await db.employee.find(query).count()

    return {
        items: items,
        pageSize: page.limit,
        pageNo: page.pageNo,
        total: total
    }
}

exports.getSingleDayAttendancesExcel = (req, res) => {
    let query = {
        organization: req.context.organization,
        status: 'active'
    }

    let shiftEnd = req.query.byShiftEnd === 'true'

    let shiftLength = req.query.byShiftLength === 'true'

    let ofDate = req.query.ofDate || moment()

    let fromDate = ofDate ? moment(ofDate).startOf('day') : moment().startOf('day')

    let getExtraHours = {
        byShiftEnd: shiftEnd,
        byShiftLength: shiftLength
    }

    // getExtraHours = req.query.extraHours || true,

    let toDate = ofDate ? moment(ofDate).endOf('day') : moment().endOf('day')

    let fileName = ofDate
        ? 'DayAttendance-' + moment(ofDate).format('MMMM Do') + '.xlsx'
        : 'DayAttendance-' + moment().format('MMMM Do') + '.xlsx'

    let organizationName = req.context.organization.name

    if (req.query.name) {
        query.name = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    if (req.query.code) {
        query.code = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query['emp.tags'] = { $in: tagIds }
    }

    if (req.query.shiftTypeId) {
        query.shiftType = global.toObjectId(req.query.shiftTypeId)
    }

    db.employee.find(query)
        .sort({ name: 1 })
        .then(employees => {
            return Promise.mapSeries(employees, emp => {
                return db.attendance.findOne({
                    employee: emp,
                    ofDate: {
                        $gte: fromDate,
                        $lt: toDate
                    }
                }).populate({
                    path: 'shift',
                    populate: {
                        path: 'shiftType'
                    }
                })
                    .then(attendance => {
                        emp.attendance = attendance
                        return emp
                    })
            }).then(employees => {
                var thatDayEmployees = []
                _.each(employees, item => {
                    thatDayEmployees.push(item)
                    var rejectedEmp
                    if (item.attendance === null) {
                        rejectedEmp = item
                        thatDayEmployees.splice(thatDayEmployees.indexOf(rejectedEmp), 1)
                    }
                })
                return thatDayEmployees
            })
                .catch(err => {
                    throw err
                })
        })
        .then(employees => {
            return xlBuilderSingleDay(fileName, ofDate, getExtraHours, employees, organizationName)
        })
        .then(result => {
            if (result.isCreated) {
                return res.download(join(appRootPath.path, `temp/${fileName}`), fileName, function (err) {
                    if (err) {
                        throw err
                    }
                    fs.unlink(join(appRootPath.path, `temp/${fileName}`), function (err) {
                        if (err) {
                            throw err
                        }
                    })
                })
            }
            throw result
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.singleEmployeeMonthlyReport = (req, res) => {
    let query = {
        organization: global.toObjectId(req.context.organization.id),
        _id: global.toObjectId(req.query.employee)
    }

    let shiftEnd = req.query.byShiftEnd === 'true'

    let shiftLength = req.query.byShiftLength === 'true'

    let fileName

    let empInfo

    let attendances = []

    let ofDate = req.query.ofDate

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let getExtraHours = {
        byShiftEnd: shiftEnd,
        byShiftLength: shiftLength
    }

    let orgDetails = {
        orgName: req.context.organization.name,
        downloaderName: req.employee.name,
        downloaderEmail: req.employee.email,
        downloaderPhone: req.employee.phone
    }
    // getExtraHours = req.query.extraHours || true;
    db.employee.aggregate([{
        $match: query
    }, {
        $project: {
            name: 1,
            code: 1,
            designation: 1
        }
    }]).then(employees => {
        let employee = employees[0]
        empInfo = employee.name || employee.code

        return Promise.all([
            db.leave.find({
                employee: global.toObjectId(employee._id),
                status: 'approved',
                date: {
                    $gte: fromDate,
                    $lt: moment()
                }
            }).populate('leaveType'),
            db.monthSummary.findOne({
                employee: employee,
                weekStart: fromDate,
                weekEnd: toDate
            }).populate({
                path: 'attendances',
                populate: {
                    path: 'shift',
                    populate: {
                        path: 'shiftType'
                    }
                }
            })
        ])
            .spread((leaves, monthLog) => {
                return attendances.push({
                    employee: employee,
                    leaves: leaves,
                    monthLog: monthLog
                })
            }).catch(err => {
                throw err
            })
    }).then(() => {
        fileName = ofDate
                ? `${empInfo}-` + moment(ofDate).startOf('month').format('MMMM Do') + '.xlsx'
                : `${empInfo}-` + moment().startOf('month').format('MMMM Do') + '.xlsx'

        return xlBuilder(fileName, ofDate, getExtraHours, attendances, orgDetails)
    })
        .then(result => {
            if (result.isCreated) {
                return res.download(join(appRootPath.path, `temp/${fileName}`), fileName, function (err) {
                    if (err) {
                        throw err
                    }
                    fs.unlink(join(appRootPath.path, `temp/${fileName}`), function (err) {
                        if (err) {
                            throw err
                        }
                    })
                })
            }
            throw result
        }).catch(err => {
            res.failure(err)
        })
}

// create past dummy attendance
exports.markAbsentAttendance = (req, res) => {
    let markAbsetFrom = req.body.fromDate
    let absentFrom = moment(markAbsetFrom)
    let orgId = req.context.organization.id.toString()
    let daysCountTocheck = []
    daysCountTocheck.length = moment().diff(absentFrom, 'days')
    res.success('marking absent soon')

    return db.employee.find({
        organization: orgId
    })
        .populate('shiftType')
        .then(employees => {
            return Promise.each(employees, employee => {
                return Promise.each(daysCountTocheck, item => {
                    let todayStatus = dayStatus(employee.shiftType, absentFrom)

                    console.log(moment(absentFrom).format('LLLL') + ' , ' + todayStatus)
                    let shiftDate = moment(absentFrom)
                        .set('hour', moment(employee.shiftType.startTime).hours())
                        .set('minute', moment(employee.shiftType.startTime).minutes())
                        .set('second', moment(employee.shiftType.startTime).seconds())
                        .set('millisecond', moment(employee.shiftType.startTime).milliseconds())._d

                    let shiftModel = {
                        shiftType: employee.shiftType,
                        status: todayStatus,
                        date: shiftDate
                    }

                    return dbQuery.getHoliday({ date: absentFrom, organization: orgId }).then(holiday => {
                        if (holiday) {
                            shiftModel.status = 'holiday'
                            shiftModel.holiday = holiday
                        }

                        return db.shift.findOrCreate({
                            shiftType: employee.shiftType,
                            date: shiftDate
                        }, shiftModel, { upsert: true })
                    }).then(shift => {
                        let fromDate = absentFrom

                        let toDate = moment(fromDate)
                            .set('hour', 0).set('minute', 0)
                            .set('second', 0).set('millisecond', 0)
                            .add(1, 'day')._d

                        return db.attendance.findOrCreate({
                            employee: employee, // find one if get when person comes earlier with status checkedIn
                            shift: shift.result,
                            ofDate: {
                                $gte: fromDate,
                                $lt: toDate
                            }
                        }, {
                            employee: employee,
                            status: 'absent',
                            shift: shift.result,
                            ofDate: moment(shift.result.date)
                                .set('hour', 0).set('minute', 0)
                                .set('second', 0).set('millisecond', 0)._d

                        }).then(attendance => {
                            console.log('Dummy Attendance Created of date ' +
                                    attendance.result.ofDate + ' ' + employee.name || employee.code)
                            absentFrom = moment(absentFrom).add(1, 'day')
                        }).catch(err => {
                            throw err
                        })
                    }).catch(err => {
                        throw err
                    })
                })
                    .then(() => {
                        absentFrom = moment(data.data.date)
                    })
            }).then(() => {

            })
        })
        .catch(err => {
            logger.info('err while creating past attendances onShiftStart Job')
            logger.error(err)
        })
}

exports.getAttendanceLogs = (req, res) => {
    let employee = req.params.id === 'my' ? req.employee.id : req.params.id

    let fromDate, toDate

    if (!req.query.fromDate) {
        return res.failure('fromDate is required')
    }

    fromDate = moment(req.query.fromDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    if (req.query.toDate) {
        toDate = moment(req.query.toDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
    } else {
        toDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
    }

    let query = {
        employee: employee
    }

    query.ofDate = {
        $gte: fromDate,
        $lt: toDate
    }

    async.waterfall([
        cb => {
            db.attendance.find(query)
                .sort('ofDate')
                .populate({
                    path: 'shift',
                    populate: {
                        path: 'shiftType holiday'
                    }
                })
                .exec((err, attendances) => {
                    if (err) {
                        cb(err)
                    }
                    return cb(null, attendances)
                })
        },
        (attendances, cb) => {
            async.eachSeries(attendances, (attendance, next) => {
                let logsQuery = {
                    employee: attendance.employee
                }
                logsQuery.time = {
                    $gte: moment(attendance.ofDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d,
                    $lt: moment(attendance.ofDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
                }
                db.timeLog.find(logsQuery)
                    .populate('device')
                    .sort({ time: 1 })
                    .then(timeLogs => {
                        attendance.timeLogs = timeLogs
                        next()
                    }).catch(err => {
                        next()
                    })
            }, (err) => {
                if (err) {
                    return cb(err)
                }
                return cb(null, attendances)
            })
        }
    ], (err, attendances) => {
        if (err) {
            return res.failure(err)
        }
        return res.page(summaryMapper.logs(attendances))
    })
}

exports.trackLocation = (req, res) => {
    let args = {
        headers: {
            'Content-Type': 'application/json'
        },
        parameters: {
            noPaging: true,
            'latlng': `${req.body.location.coordinates[1]}, ${req.body.location.coordinates[0]}`,
            'key': locationConfig.key
        }
    }

    return client.getPromise(locationConfig.baseUrl, args)
        .then((response) => {
            let location = {
                coordinates: req.body.location.coordinates
            }

            if (response.data.results.length > 0) {
                location.name = response.data.results[2].formatted_address
                location.description = response.data.results[0].formatted_address
            }

            let model = {
                attendance: req.params.id,
                employee: req.employee.id,
                time: req.body.time,
                ipAddress: ip.getIpAddress(req),
                message: req.body.message,
                location: location
            }
            return new db.locationLog(model).save()
                .then((locationLog) => {
                    if (!locationLog.message) {
                        req.context.processSync = true
                        offline.queue('locationLog', 'create', { id: locationLog.id }, req.context)
                            .then(() => locationLog)
                    }

                    return res.data(locationMapper.toModel(locationLog))
                }).catch(err => res.failure(err))
        })
}

exports.getLocationLogs = async (req, res) => {
    let model = {
        attendance: req.params.id
    }
    try {
        let attendance = await db.attendance.findById(req.params.id).populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

        if (!attendance || !attendance.checkIn) {
            return res.page([])
        }

        let locationLogs = await db.locationLog.find(model)
            .sort({ time: -1 })

        let from = attendance.checkIn
        let till = attendance.checkOut

        if (!till && moment(new Date()).isSame(attendance.ofDate, 'day')) {
            till = new Date()
        }

        if (!till) {
            let endTime = moment(attendance.shift.shiftType.endTime)
            let till = moment(attendance.ofDate)
                .set('hour', endTime.get('hour'))
                .set('minute', endTime.get('minute'))
                .set('second', endTime.get('second')).toDate()

            if (till < from) {
                till = moment(attendance.ofDate).add(1, 'days')
                    .set('hour', endTime.get('hour'))
                    .set('minute', endTime.get('minute'))
                    .set('second', endTime.get('second')).toDate()
            }
        }

        let logs = []

        let lastLog

        for (let date = moment(till); moment(from).isBefore(date); date = moment(date).subtract(30, 'minutes')) {
            let log = locationLogs.find(item =>
                moment(item.time).isBetween(date, moment(date).add(30, 'minutes'), 's', '[]')) ||
                lastLog
            if (log) {
                logs.push({
                    time: date.toDate(),
                    attendance: log.attendance,
                    employee: log.employee,
                    ipAddress: log.ipAddress,
                    location: log.location,
                    message: log.message
                })

                lastLog = log
            }
        }

        return res.page(locationMapper.toSearchModel(logs))
    } catch (err) {
        return res.failure(err)
    }
}

exports.LocationLogsByDate = (req, res) => {
    let employee = req.params.id === 'my' ? req.employee.id : req.params.id

    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
            : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
            : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    let model = {
        employee: employee,
        time: {
            $gte: fromDate,
            $lt: toDate
        }
    }
    db.locationLog.find(model)
        .sort({ time: -1 })
        .then((locationLogs) => {
            return res.page(locationMapper.toSearchModel(locationLogs))
        }).catch(err => res.failure(err))
}
// For updating team in attendance For Developer
exports.upadteTeamInAttendance = (req, res) => {
    if (!req.context.organization) {
        return res.failure('org-code is required')
    }
    if (!req.query.fromDate) {
        return res.failure('fromDate is required')
    }
    if (!req.query.toDate) {
        return res.failure('fromDate is required')
    }
    res.success('team in attendance will be updated soon')
    return db.employee.find({
        organization: req.context.organization,
        status: 'active'
    }).then((employees) => {
        return Promise.each(employees, employee => {
            logger.info(`employee found ${employee.name}`)
            return Promise.all([teams.getSupervisors(employee._id.toString()),
                db.attendance.find({
                    employee: employee,
                    ofDate: {
                        $gte: req.query.fromDate,
                        $lt: req.query.toDate
                    }
                }).sort({ ofDate: 1 })
            ])
                .spread((supervisors, attendances) => {
                    logger.info(`employee have ${supervisors.length} superviors`)
                    if (supervisors.length <= 0) {
                        return
                    }
                    return Promise.each(attendances, attendance => {
                        var context = {}
                        var lastWorkedHours
                        context.organization = {}
                        context.employee = employee.id.toString()
                        context.organization.id = employee.organization.toString()
                        context.processSync = true
                        return offline.queue('supervisor', 'attendance', {
                            id: attendance.id,
                            lastWorkedHours: lastWorkedHours,
                            updatePreviousAttendance: true
                        }, context).then(() => {

                        }).catch((err) => {
                            logger.info(err)
                            return err
                        })
                    })
                })
        })
    })
}
// For deleting team in attendance For Developer
exports.deleteTeamInAttendance = (req, res) => {
    if (!req.context.organization) {
        return res.failure('org-code is required')
    }
    if (!req.query.fromDate) {
        return res.failure('fromDate is required')
    }
    if (!req.query.toDate) {
        return res.failure('toDate is required')
    }
    res.success('team in attendance will be deleted soon')
    return db.employee.find({
        organization: req.context.organization,
        status: 'active'
    }).then((employees) => {
        return Promise.each(employees, employee => {
            logger.info(`employee found ${employee.name}`)
            return db.attendance.find({
                employee: employee,
                ofDate: {
                    $gte: req.query.fromDate,
                    $lt: req.query.toDate
                }
            }).sort({ ofDate: 1 }).then((attendances) => {
                return Promise.each(attendances, attendance => {
                    if (attendance.team.teamCount) {
                        attendance.team = {}
                        attendance.save()
                            .then(() => {
                                logger.info('attendance updated')
                            })
                            .catch((err) => {
                                logger.info('error in attendance updated')
                            })
                    }
                    logger.info('teamCount not Found')
                })
            })
        })
    })
}
// For updating hoursworked in attendance
exports.updateHoursWorked = (req, res) => {
    return db.employee.find({
        organization: req.context.organization.id,
        status: 'active'
    })
        .then((employees) => {
            return Promise.each(employees, employee => {
                return db.attendance.find({
                    employee: employee,
                    ofDate: {
                        $gte: moment('2017-10-15').startOf('month')._d,
                        $lt: moment() // for perticular punchDate
                            .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
                    },
                    checkIn: { $exists: true },
                    checkOut: { $exists: true },
                    status: 'missSwipe'
                })
                    .populate('employee')
                    .populate({ path: 'shift', populate: { path: 'shiftType' } })
                    .then((attendances) => {
                        return Promise.each(attendances, attendance => {
                            var status
                            var timeInOffice = moment(attendance.checkOut).diff(moment(attendance.checkIn), 'minutes')
                            console.log(timeInOffice)
                            if (timeInOffice < ((Math.abs(moment(attendance.shift.shiftType.endTime).diff(moment(attendance.shift.shiftType.startTime), 'minutes')) / 2) + 60)) {
                                status = 'halfday'
                            } else {
                                status = 'present'
                            }
                            var minsInOfc = timeInOffice % 60
                            var hrsInOfc = (timeInOffice - minsInOfc) / 60
                            attendance.hoursWorked = hrsInOfc
                            attendance.minsWorked = minsInOfc
                            attendance.status = status
                            return attendance.save()
                                .then(() => {
                                    console.log('attendance updated')
                                })
                        })
                    })
            })
        })
}

exports.extendShift = (req, res) => {
    let updateQuery = {}

    if (!req.params.id) {
        return res.failure('id is required')
    }

    if (!req.body.checkOutExtend) {
        updateQuery = {
            $unset: {
                checkOutExtend: 1
            }
        }
    } else {
        updateQuery = {
            $set: {
                checkOutExtend: moment(req.body.checkOutExtend)._d
            }
        }
    }

    return db.attendance.findByIdAndUpdate({ _id: req.params.id }, updateQuery, { new: true })
        .then((attendance) => {
            if (!attendance) {
                return res.failure('no attendance found')
            }
            return res.data(mapper.toModel(attendance))
        })
        .catch(err => {
            return res.failure(err)
        })
}
