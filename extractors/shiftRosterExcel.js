'use strict'
var XLSX = require('xlsx')
var async = require('async')
var moment = require('moment')

exports.extract = (file, callback) => {
    if (!XLSX.readFile(file.record.path).Sheets.Sheet1) {
        return callback('Sheet1 is required !!')
    }

    var excelSheet = XLSX.readFile(file.record.path).Sheets.Sheet1
    // var totalRows = parseInt(excelSheet['!ref'].slice(parseInt(excelSheet['!ref'].search('I')) + 1));
    let totalRows = parseInt(excelSheet['B3'].v) + 8
    var rows = []
    for (var row = 8; row <= totalRows; row++) {
        rows.push(row)
    }
    let employees = []

    async.eachSeries(rows, (row, next) => {
        let employee = {
            empCode: '',
            empName: '',
            rosterShiftTypes: []
        }

        let shiftDetails = {
            code: '',
            date: ''
        }
        if (!excelSheet['B' + row]) {
            return next()
        }

        if (excelSheet['A' + row] && excelSheet['B' + row]) {
            employee.empCode = excelSheet['A' + row].v
            employee.empName = excelSheet['B' + row].v

            if (excelSheet['C' + row]) {
                shiftDetails.code = excelSheet['C' + row].v
                shiftDetails.date = excelSheet['C7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['D' + row]) {
                shiftDetails.code = excelSheet['D' + row].v
                shiftDetails.date = excelSheet['D7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['E' + row]) {
                shiftDetails.code = excelSheet['E' + row].v
                shiftDetails.date = excelSheet['E7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['F' + row]) {
                shiftDetails.code = excelSheet['F' + row].v
                shiftDetails.date = excelSheet['F7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['G' + row]) {
                shiftDetails.code = excelSheet['G' + row].v
                shiftDetails.date = excelSheet['G7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['H' + row]) {
                shiftDetails.code = excelSheet['H' + row].v
                shiftDetails.date = excelSheet['H7'].v
                employee.rosterShiftTypes.push(shiftDetails)
                shiftDetails = {}
            }
            if (excelSheet['I' + row]) {
                shiftDetails.code = excelSheet['I' + row].v
                shiftDetails.date = excelSheet['I7'].v
                employee.rosterShiftTypes.push(shiftDetails)
            }
        }
        employees.push(employee)
        return next()
    }, (err) => {
        if (err) {
            return callback(err)
        }
        return callback(null, employees)
    })
}
