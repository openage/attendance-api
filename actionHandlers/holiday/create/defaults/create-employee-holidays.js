'use strict'
const _ = require('underscore')
const moment = require('moment')
const dbQuery = require('../../../../helpers/querify')
const logger = require('@open-age/logger')
('attendance.check-in.handlers.notify-supervisor-for-minutes-late-inRow')
const db = require('../../../../models')
exports.process = (data, context, callback) => {
    let shift = data.shift
    let orgId = data.orgId

    let fromDate = moment(shift.date) // for perticular punchDate
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = moment(fromDate)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d

    return dbQuery.findEmployees({ organization: orgId })
        .then(employees => {
            return Promise.each(employees, employee => {
                console.log('Holiday attendance Created: ' + employee.name)

                return db.attendance.findOrCreate({
                    employee: employee.id, // find one if get when person comes earlier with status checkedIn
                    shift: shift._id || shift.id,
                    ofDate: {
                        $gte: fromDate,
                        $lt: toDate
                    }
                }, {
                    employee: employee,
                    status: 'absent',
                    shift: shift._id || shift.id,
                    ofDate: fromDate // same as shift time
                })
                    .catch(err => {
                        throw err
                    })
            })
            callback()
        }).catch(err => {
            logger.info('err in create employee holidays')
            logger.error(err)
            return callback(err)
        })
}
