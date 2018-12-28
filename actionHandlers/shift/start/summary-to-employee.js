'use strict'
const moment = require('moment')
const _ = require('underscore')
const checkDayStatus = require('../../../services/shifts')
const entities = require('../../../helpers/entities')
const communications = require('../../../services/communications')
const logger = require('@open-age/logger')
('leave.submit.handlers.send-notification-to-supervisor')
const db = require('../../../models')

function attendanceMapper (attendance) {
    return {
        attDate: moment(attendance.ofDate).format('D MMMM YYYY'),
        day: moment(attendance.ofDate).format('dddd'),
        checkIn: attendance.checkIn ? moment(attendance.checkIn).format('hh:mmA') : '-',
        checkOut: attendance.checkOut ? moment(attendance.checkOut).format('hh:mmA') : '-',
        timeWorked: (attendance.hoursWorked || attendance.minsWorked) ? `${attendance.hoursWorked || '0'}h ${attendance.minsWorked || '0'}m` : '-',
        dayStatus: attendance.shift ? (attendance.shift.status === 'working' ? attendance.status : attendance.shift.status) : attendance.status
    }
}

exports.process = (data, alert, context) => {
    // let employee = data.employee;
    logger.info(`employee-summary-alert has been triggered`)

    let supervisorLevel = 0
    let channels = ['push']
    let employeeId = data.employee.id

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    let weekStart = moment()
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).subtract(8, 'days')._d

    let weekEnd = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).subtract(1, 'days')._d

    return db.employee.findById(employeeId)
        .populate('shiftType')
        .then(employee => {
            if (!employee.status || employee.status !== 'active') {
                return Promise.resolve(null)
            }

            let fromDate = moment() // for perticular punchDate
                .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

            return Promise.all([checkDayStatus.getShiftStatus(employee.shiftType,
                moment(fromDate).subtract(1, 'day')),
            checkDayStatus.getShiftStatus(employee.shiftType,
                moment(fromDate))
            ])
                .spread((yesterdayStatus, todayStatus) => {
                    if (yesterdayStatus === 'weekOff' && todayStatus === 'working') {
                        return employee
                    } else {
                        logger.info(`Today is not week of`)
                        return Promise.resolve(null)
                    }
                })
        })
        .then(employee => {
            if (!employee) {
                return Promise.resolve(null)
            }

            return Promise.all([
                db.weekSummary.findOne({
                    employee: employee,
                    weekStart: {
                        $gte: weekStart
                    },
                    weekEnd: {
                        $lt: weekEnd
                    }
                }),
                db.attendance.find({
                    employee: employee._id,
                    ofDate: {
                        $gte: weekStart,
                        $lt: weekEnd
                    }
                })
                    .populate('shift')
                    .sort({ ofDate: 1 })
            ])
                .spread((weekSummary, attendances) => {
                    if (!weekSummary && _.isEmpty(attendances)) {
                        return Promise.resolve(null)
                    }

                    let summary = []
                    let missSwipeCount = 0
                    let leavesCount = 0
                    let absentCount = 0

                    _.each(attendances, attendance => {
                        summary.push(attendanceMapper(attendance))

                        if (!attendance || !attendance.shift) {
                            logger.error('no shift found while sending summary')
                            return
                        }

                        if (!attendance.shift.status) {
                            if (attendance.status === 'missSwipe') {
                                ++missSwipeCount
                                return
                            }

                            if (attendance.status === 'onLeave') {
                                ++leavesCount
                                return
                            }

                            if (attendance.status === 'absent') {
                                ++absentCount
                            }
                        } else {
                            if (attendance.shift.status === 'working' && attendance.status === 'absent') {
                                absentCount++
                                return
                            }

                            if (attendance.shift.status === 'working' && attendance.status === 'onLeave') {
                                leavesCount++
                            }
                        }
                    })

                    let stats = {
                        missSwipeCount: missSwipeCount,
                        leavesCount: leavesCount,
                        absentCount: absentCount,
                        weekStart: weekStart,
                        weekEnd: weekEnd
                    }

                    return {
                        weekSummary: weekSummary,
                        stats: stats,
                        summary: summary,
                        employee: employee
                    }
                })
        })
        .then(summaryData => {
            if (!summaryData) {
                return Promise.resolve(null)
            }

            if (!summaryData.weekSummary) {
                logger.info(`week summary not found while on trigger summary-to-employee alert of ${summaryData.employee.name || summaryData.employee.code}`)
            }

            return communications.send({
                employee: summaryData.employee,
                level: supervisorLevel
            }, {
                actions: [],
                entity: entities.toEntity(summaryData.employee, 'employee'),
                data: {
                    employee: summaryData.employee.name || summaryData.employee.code || '',
                    weekStart: summaryData.weekSummary ? moment(summaryData.weekSummary.weekStart).format('Do MMM') : moment(summaryData.stats.weekStart).format('Do MMM'),

                    weekEnd: summaryData.weekSummary ? moment(summaryData.weekSummary.weekEnd).format('Do MMM') : moment(summaryData.stats.weekEnd).format('Do MMM'),

                    attendanceCount: summaryData.weekSummary ? summaryData.weekSummary.attendanceCount : 0,
                    hoursWorked: summaryData.weekSummary ? Math.trunc(summaryData.weekSummary.hoursWorked) : 0,
                    minsWorked: summaryData.weekSummary ? Math.trunc((summaryData.weekSummary.hoursWorked % 1) * 60) : 0,
                    leaveTaken: summaryData.stats.leavesCount || 0,
                    missSwipeCount: summaryData.stats.missSwipeCount || 0,
                    absentCount: summaryData.stats.absentCount || 0,
                    summary: summaryData.summary
                },
                template: 'employee-summary'
            }, channels, context)
        })
        .catch(err => {
            logger.info(`err on trigger alert trigger summary-to-employee alert`)
            logger.error(`${err}`)
        })
}
