const moment = require('moment')
const reports = require('../helpers/reports')
const excelBuilder = require('msexcel-builder')
const logger = require('@open-age/logger')('form-25')

const buildHeader = (sheet1, date, context) => {
    sheet1.merge({
        col: 1,
        row: 1
    }, {
        col: 11,
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
    sheet1.merge({
        col: 1,
        row: 3
    }, {
        col: 9,
        row: 3
    })
    sheet1.set(1, 3, `Monthly Attendance Report`)
    sheet1.font(1, 3, {
        bold: 'true'
    })
    sheet1.align(1, 3, 'center')
    sheet1.merge({
        col: 10,
        row: 3
    }, {
        col: 11,
        row: 3
    })
    sheet1.set(10, 3, `Month: ${moment(date).format('MMMM, YYYY')}`)
    sheet1.font(10, 3, {
        bold: 'true'
    })
    sheet1.align(10, 3, 'left')

    return 3
}

const setColumnHeader = (sheet1, columnNo, rowNo, text, noOfColumns, noOfRows, width, vertical) => {
    noOfColumns = noOfColumns || 1
    noOfRows = noOfRows || 1

    if (noOfColumns > 1 && noOfRows > 1) {
        sheet1.merge({
            col: columnNo,
            row: rowNo
        }, {
            col: columnNo + noOfColumns,
            row: rowNo + noOfRows
        })
    }
    sheet1.width(columnNo, width)
    sheet1.font(columnNo, rowNo, {
        sz: '10'
    })
    if (vertical) {
        sheet1.rotate(columnNo, rowNo, 90)
    }
    // sheet1.valign(columnNo, 7, 'center')
    // sheet1.border(columnNo, 6, {
    //     left: 'thin',
    //     top: 'thin',
    //     right: 'thin'
    // })
    // sheet1.border(columnNo, 7, {
    //     left: 'thin',
    //     bottom: 'thin',
    //     right: 'thin'
    // })
    sheet1.set(columnNo, rowNo, text)
}

const setData = (sheet1, columnNo, rowNo, text) => {
    sheet1.font(columnNo, rowNo, {
        sz: '10'
    })
    sheet1.align(columnNo, rowNo, 'center')
    sheet1.border(columnNo, rowNo, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.set(columnNo++, rowNo, text)
}
const buildColumnHeaders = async (sheet1, date, context) => {
    let columns = {
        serialNo: 1,
        employee: {
            name: 4,
            code: 1
        },
        date: 1,
        shift: 2,
        status: 3,
        checkIn: 4,
        checkOut: 5,
        totalHours: 6,
        out1: 7,
        in1: 8,
        breakTime: 9,
        netHours: 10,
        comment: 11
    }

    return columns
}

const formatHeaders = (sheet1, columnNo, rowNo) => {
    sheet1.font(columnNo, rowNo, {
        bold: 'true',
        sz: '10'
    })
    sheet1.border(columnNo, rowNo, {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    })
    sheet1.align(columnNo, rowNo, 'center')
}
const setColumnHeaders = (employee, columns, rowNo, sheet1) => {
    setColumnHeader(sheet1, columns.employee.name, rowNo + 1, `Employee Name: ${employee.name}`, 4, 1, 20.0)
    sheet1.merge({
        col: columns.employee.name,
        row: rowNo + 1
    }, {
        col: columns.employee.name + 3,
        row: rowNo + 1
    })
    sheet1.font(columns.employee.name, rowNo + 1, {
        bold: 'true'
    })
    sheet1.align(columns.employee.name, rowNo + 1, 'center')
    setColumnHeader(sheet1, columns.employee.code, rowNo + 1, `Employee Code: ${employee.code}`, 2, 1, 20.0)
    sheet1.merge({
        col: columns.employee.code,
        row: rowNo + 1
    }, {
        col: columns.employee.code + 1,
        row: rowNo + 1
    })
    sheet1.font(columns.employee.code, rowNo + 1, {
        bold: 'true'
    })
    sheet1.align(columns.employee.code, rowNo + 1, 'center')
    setColumnHeader(sheet1, columns.date, rowNo + 2, `Date`, 1, 1, 5.0)
    formatHeaders(sheet1, columns.date, rowNo + 2)

    setColumnHeader(sheet1, columns.shift, rowNo + 2, `Shift`, 1, 1, 13.0)
    formatHeaders(sheet1, columns.shift, rowNo + 2)

    setColumnHeader(sheet1, columns.status, rowNo + 2, `Status`, 1, 1, 8.0)
    formatHeaders(sheet1, columns.status, rowNo + 2)

    setColumnHeader(sheet1, columns.checkIn, rowNo + 2, `Check In`, 1, 1, 8.0)
    formatHeaders(sheet1, columns.checkIn, rowNo + 2)

    setColumnHeader(sheet1, columns.checkOut, rowNo + 2, `Check Out`, 1, 1, 8.0)
    formatHeaders(sheet1, columns.checkOut, rowNo + 2)

    setColumnHeader(sheet1, columns.totalHours, rowNo + 2, `Total Hours`, 1, 1, 10.0)
    formatHeaders(sheet1, columns.totalHours, rowNo + 2)

    setColumnHeader(sheet1, columns.out1, rowNo + 2, `Break In`, 1, 1, 8.0)
    formatHeaders(sheet1, columns.out1, rowNo + 2)

    setColumnHeader(sheet1, columns.in1, rowNo + 2, `Break out`, 1, 1, 8.0)
    formatHeaders(sheet1, columns.in1, rowNo + 2)

    setColumnHeader(sheet1, columns.breakTime, rowNo + 2, `Total Break`, 1, 1, 10.0)
    formatHeaders(sheet1, columns.breakTime, rowNo + 2)

    setColumnHeader(sheet1, columns.netHours, rowNo + 2, `Net Hours`, 1, 1, 9.0)
    formatHeaders(sheet1, columns.netHours, rowNo + 2)

    setColumnHeader(sheet1, columns.comment, rowNo + 2, `Comment`, 1, 1, 20.0)
    formatHeaders(sheet1, columns.comment, rowNo + 2)

    return rowNo + 3
}

exports.build = async (fileName, ofDate, employees, context) => {
    const log = logger.start('build')

    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    var totalEmployees = employees.length

    var sheet1 = workbook.createSheet('Attendances', 100, (5 + totalEmployees) * 35)
    var rowNo = buildHeader(sheet1, ofDate, context)

    let columns = await buildColumnHeaders(sheet1, ofDate, context)

    log.info('starting injecting data into sheet1')
    for (const data of employees) {
        rowNo = setColumnHeaders(data, columns, rowNo, sheet1)
        for (const item of data.rows) {
            setData(sheet1, columns.date, rowNo, item.date)
            setData(sheet1, columns.shift, rowNo, item.shift)
            setData(sheet1, columns.status, rowNo, item.status)
            setData(sheet1, columns.checkIn, rowNo, item.checkIn)
            setData(sheet1, columns.checkOut, rowNo, item.checkOut)
            setData(sheet1, columns.totalHours, rowNo, item.totalHours)
            setData(sheet1, columns.out1, rowNo, item.out1)
            setData(sheet1, columns.in1, rowNo, item.in1)
            setData(sheet1, columns.breakTime, rowNo, item.breakTime)
            setData(sheet1, columns.netHours, rowNo, item.netHours)
            setData(sheet1, columns.comment, rowNo, item.comment)
            rowNo = rowNo + 1
        }
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
