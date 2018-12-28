'use strict'
var weekly = require('../../../../services/weekly-summaries')
var monthly = require('../../../../services/monthly-summaries')
const db = require('../../../../models')

exports.process = async (attendance, context) => {
    let entity = db.attendance.findById(attendance.id).populate({
        path: 'employee'
    })
    await weekly.update(entity.ofDate, entity.employee, context)
    await monthly.update(entity.ofDate, entity.employee, context)
}
