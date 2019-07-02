'use strict'
var weekly = require('../../../../services/weekly-summaries')
var monthly = require('../../../../services/monthly-summaries')
const db = require('../../../../models')

exports.process = async (attendance, context) => {
    await weekly.update(attendance.ofDate, attendance.employee, context)
    await monthly.update(attendance.ofDate, attendance.employee, context)
}
