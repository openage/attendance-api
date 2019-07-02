'use strict'
const db = require('../models')
exports.get = async (id, context) => {
    const log = context.logger.start('get')

    return db.locationLog.findById(id).populate('attendance')
}

exports.getByAttendance = async (attendanceId, context) => {
    const log = context.logger.start('getByAttendance')

    return db.locationLog.find({ attendance: attendanceId }).populate('attendance')
}
