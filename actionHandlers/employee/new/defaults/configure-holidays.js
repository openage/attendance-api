'use strict'
const moment = require('moment')
const employeeService = require('../../../../services/employees')
const logger = require('@open-age/logger')
('employee.new.defaults.configure-holidays')
const db = require('../../../../models')

let getDates = date => {
    let fromDate = moment(date) // for perticular punchDate
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = moment(date)
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    return {
        fromDate: fromDate,
        toDate: toDate
    }
}

exports.process = (data, context, callback) => {
    logger.start('process')

    let emp = data.employee

    logger.info(`configuring all holidays of ${emp.name || emp.code}`)

    return Promise.all([
        db.holiday.find({ organization: emp.organization }),

        employeeService.shiftManeger([emp])
            .then(data => {
                return db.employee.findOneAndUpdate({ _id: emp._id }, {
                    $set: { shiftType: data[0].shiftType }
                }, { new: true })
            })
    ])
        .spread((holidays, updatedEmployee) => {
            return Promise.each(holidays, holiday => {
                let dates = getDates(holiday.date)

                return db.shift.findOne({
                    shiftType: updatedEmployee.shiftType,
                    date: {
                        $gte: dates.fromDate,
                        $lt: dates.toDate
                    }
                })
                    .then(shift => {
                        return db.attendance.findOrCreate({
                            employee: updatedEmployee,
                            shift: shift
                        }, {
                            employee: updatedEmployee,
                            status: 'absent',
                            shift: shift,
                            ofDate: dates.fromDate
                        }, { new: true })
                    })
            })
                .then(() => {
                    logger.info(`all holidays of ${updatedEmployee.name || updatedEmployee.code} has been successfully configured`)
                    return callback()
                })
                .catch(err => {
                    throw err
                })
        })
        .catch(err => {
            logger.info('err in configuring holidays on employee create')
            logger.error(err)
            return callback(err)
        })
}
