'use strict'
const db = require('../../../../models')
const monthSummaryService = require('../../../../services/monthly-summaries')

exports.process = async (data, context) => {
    let leaveId = data.id
    let leave = await db.leave.findById(leaveId).populate('employee')
    await monthSummaryService.updateLeaves(leave, context)
}
