'use strict'
const db = require('../../../models')
const sendIt = require('@open-age/send-it-client')

const moment = require('moment')

const getConfig = (context) => {
    const orgConfig = context.getConfig('day.end.alert.summary')

    if (!orgConfig) { return }
    let config = {
        trigger: {

        },
        action: {
            type: 'notify-supervisor',
            priority: 'low',
            modes: { push: true }
        }
    }

    if (orgConfig.action) {
        if (orgConfig.action.type) {
            config.action.type = orgConfig.action.type
        }

        if (orgConfig.action.priority) {
            config.action.priority = orgConfig.action.priority
        }

        if (orgConfig.action.modes) {
            config.action.modes = orgConfig.action.modes
        }
    }

    return config
}

exports.process = async (day, context) => {
    const today = day.date
    const tomorrow = moment(today).add(1, 'day').toDate()
    const dayAfter = moment(today).add(2, 'day').toDate()

    let config = getConfig(context)

    if (!config) {
        return
    }

    let supervisors = await db.employee.find({
        organization: context.organization,
        reportees: {
            $exists: true
        },
        status: 'active'
    })

    // shift wise
    // employees on leave

    supervisors = supervisors || []

    for (const supervisor of supervisors) {
        const onLeaveCount = await db.attendance.count({
            employee: { $in: supervisor.reportees },
            ofDate: today,
            status: 'onLeave'
        })

        const presentCount = await db.attendance.count({
            employee: { $in: supervisor.reportees },
            ofDate: today,
            status: 'present'
        })

        const absents = await db.attendance.find({
            employee: { $in: supervisor.reportees },
            ofDate: today,
            status: 'absent'
        }).populate('employee')

        const absentEmployees = absents.map(a => {
            return {
                id: a.employee.id,
                name: a.employee.name,
                code: a.employee.code
            }
        })

        const leavesTomorrow = await db.leave.find({
            employee: { $in: supervisor.reportees },
            date: { $lte: tomorrow },
            toDate: { $gte: tomorrow },
            status: 'approved'
        }).populate('employee leaveType')

        const leavesDayAfter = await db.leave.find({
            employee: { $in: supervisor.reportees },
            date: { $lte: dayAfter },
            toDate: { $gte: dayAfter },
            status: 'approved'
        }).populate('employee leaveType')

        const onLeaveTomorrowEmployees = leavesTomorrow.map(l => {
            return {
                id: l.employee.id,
                name: l.employee.name,
                code: l.employee.code,
                leave: {
                    id: l.id,
                    days: l.days,
                    type: l.leaveType.name
                }
            }
        })

        const onLeaveDayAferEmployees = leavesTomorrow.map(l => {
            return {
                id: l.employee.id,
                name: l.employee.name,
                code: l.employee.code,
                leave: {
                    id: l.id,
                    days: l.days,
                    type: l.leaveType.name
                }
            }
        })

        let message = {
            to: supervisor,
            template: 'day-summary',
            data: {
                today: {
                    date: today,
                    present: presentCount,
                    onLeave: onLeaveCount,
                    absents: absentEmployees
                },
                tomorrow: {
                    date: tomorrow,
                    onLeaves: onLeaveTomorrowEmployees
                },
                dayAfter: {
                    date: dayAfter,
                    onLeaves: onLeaveDayAferEmployees
                }

            },
            modes: config.action.modes,
            options: {
                priority: config.action.priority
            }
        }

        await sendIt.dispatch(message, context)
    }
}
