/* eslint-disable indent */
const moment = require('moment')
const dates = require('../helpers/dates')
const columnMaps = {
    default: [{
        key: 'employeeCode',
        label: 'Code'
    }, {
        key: 'date',
        label: 'Date',
        type: Date
    }, {
        key: 'in',
        label: 'In'
    }, {
        key: 'out',
        label: 'Out'
    }]
}

const parseExcelTime = (excelTime) => {
    let basenumber = (excelTime * 24)
    let hour = Math.floor(basenumber).toString()
    if (hour.length < 2) {
        hour = '0' + hour
    }

    var minute = Math.round((basenumber % 1) * 60).toString()
    if (minute.length < 2) {
        minute = '0' + minute
    }
    return moment(hour + ':' + minute + ':00', 'HH:mm:ss')
}
exports.parseDateExcel = parseExcelTime

exports.config = async (req, options) => {
    let format = options.format || 'default'

    if (!columnMaps[format]) {
        throw new Error(`'${format}' is not supported`)
    }

    return {
        sheet: 'Attendance',
        timeZone: req.context.config.timeZone,
        columnMap: columnMaps[format],
        modelMap: (row) => {
            let timeLogs = []
            let employee = {}

            let date
            let time
            if (row.date) {
                date = moment(row.date).toDate()
            }

            if (row.employeeCode) {
                employee = {
                    code: row.employeeCode
                }
            }

            if (row.in) {
                time = parseExcelTime(row.in)
                let model = {
                    date: date,
                    employee: employee,
                    type: 'checkIn',
                    source: 'byAdmin',
                    time: dates.date(date).setTime(time)
                }
                timeLogs.push(model)
            }

            if (row.out) {
                time = parseExcelTime(row.out)
                let model = {
                    date: date,
                    employee: employee,
                    type: 'checkOut',
                    source: 'byAdmin',
                    time: dates.date(date).setTime(time)
                }
                timeLogs.push(model)
            }

            return timeLogs
        },
        headerRow: 0,
        keyCol: 0
    }
}
