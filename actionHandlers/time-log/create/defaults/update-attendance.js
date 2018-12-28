'use strict'
var attendances = require('../../../../services/attendances')
const db = require('../../../../models')

exports.process = async (data, context) => {
    let timeLog = await db.timeLog.findById(data.id).populate({
        path: 'employee',
        populate: { path: 'shiftType' }
    })
    if (!timeLog) {
        throw new Error(`timeLog with id: ${data.id} not found`)
    }
    await attendances.updateByTimeLog(timeLog, context)
}
