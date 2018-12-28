'use strict'
const teams = require('../../../../services/teams')
const logger = require('@open-age/logger')('attendance.check-in.handlers.update-supervisor-team-summary')
const db = require('../../../../models')

exports.process = (data, context, callback) => {
    logger.info('updating-supervisor-team-summary')

    let teamDetails = {}
    if (!data.lastWorkedHours) {
        let lastWorkedHours
        teamDetails.lastWorkedHours = lastWorkedHours
        teamDetails.updatePreviousAttendance = data.updatePreviousAttendance
    } else {
        teamDetails.lastWorkedHours = data.lastWorkedHours
        teamDetails.updatePreviousAttendance = data.updatePreviousAttendance
    }

    return db.attendance
        .findOne({ _id: data.id })
        .populate('employee')
        .populate({ path: 'shift', populate: { path: 'shiftType' } })
        .then(attendance => {
            teamDetails.attendance = attendance
            return teams
                .updateTeamSummary(teamDetails, context)
                .then(() => {
                    return callback()
                })
                .catch(err => {
                    logger.error(err)
                    return callback(err)
                })
        })
}
