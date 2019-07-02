const db = require('../../../../models')
const leaveBalanceService = require('../../../../services/leave-balances')

exports.process = async (attendance, context) => {
    // await leaveBalanceService.runOvertimeRules(attendance, {}, context)
    // await leaveBalanceService.runWorkDayRules(attendance.employee, attendance.ofDate, {}, context)
}
