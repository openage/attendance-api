'use strict'
const weekly = require('../../services/weekly-summaries')
const monthly = require('../../services/monthly-summaries')
const webHook = require('../../helpers/web-hook')

exports.process = async (attendance, context) => {
    await weekly.update(attendance.ofDate, attendance.employee, context)
    await monthly.update(attendance.ofDate, attendance.employee, context)
    await webHook.send('attendance', 'onCreate', attendance, context)
}
