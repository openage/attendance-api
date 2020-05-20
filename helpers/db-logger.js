const db = require('../models')

module.exports = async (level, message, meta, context) => {
    try {
        let model = {
            level: level,
            message: message,
            meta: meta,
            app: process.env.APP
        }

        if (context) {
            if (context.location) {
                model.location = context.location
                if (model.location.startsWith('GET /api/logs')) {
                    return
                }
            }
            if (context.device) {
                model.device = context.device.id || context.device
            }

            if (context.leaveType) {
                model.leaveType = context.leaveType.id || context.leaveType
            }

            if (context.leave) {
                model.leave = context.leave.id || context.leave
            }

            if (context.leaveBalance) {
                model.leaveBalance = context.leaveBalance.id || context.leaveBalance
            }

            if (context.holiday) {
                model.holiday = context.holiday.id || context.holiday
            }

            if (context.shiftType) {
                model.shiftType = context.shiftType.id || context.shiftType
            }

            if (context.timeLog) {
                model.timeLog = context.timeLog.id || context.timeLog
            }

            if (context.attendance) {
                model.attendance = context.attendance.id || context.attendance
            }

            if (context.user) {
                model.employee = context.user.id || context.user
            }

            if (context.user) {
                model.user = context.user.id || context.user
            }

            if (context.organization) {
                model.organization = context.organization.id || context.organization
            }
        }

        new db.log(model).save()
    } catch (err) { }
}
