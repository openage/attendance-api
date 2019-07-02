'use strict'

const shiftService = require('../../services/shifts')
const db = require('../../models')
const moment = require('moment')

const dates = require('../../helpers/dates')

exports.process = async (shiftType, context) => {
    let shifts = await db.shift.find({
        shiftType: shiftType,
        date: {
            $gte: dates.date().bod()
        }
    }).populate('shiftType')

    for (const shift of shifts) {
        await shiftService.reset(shift, context)
    }
}
