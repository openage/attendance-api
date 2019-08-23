'use strict'

const db = require('../../../../models')
const users = require('../../../../services/employee-getter')
const sendIt = require('@open-age/send-it-client')

const attendanceService = require('../../../../services/attendances')

const attendanceStates = attendanceService.attendanceStatus

const getConfig = (context) => {
    const orgConfig = context.getConfig('attendance.checkOut.alert.onLeave')

    if (!orgConfig) { return }
    let config = {
        trigger: {
            days: 1, // no of days on leave
            shiftCount: 1 // no of shifts worked
        },
        action: {
            type: 'notify-supervisor',
            priority: 'medium',
            modes: { push: true }
        }
    }

    if (orgConfig.trigger) {
        if (orgConfig.trigger.days) {
            config.trigger.days = orgConfig.trigger.days
        }

        if (orgConfig.trigger.shiftCount) {
            config.trigger.shiftCount = orgConfig.trigger.shiftCount
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

exports.process = async (attendance, context) => {
    if (attendance.status !== attendanceStates.onLeave) {
        return
    }
    let config = getConfig(context)

    if (attendance.count < config.trigger.shiftCount) {
        return
    }

    let leave = await db.leave.findOne({
        employee: attendance.employee,
        days: {
            $gte: config.trigger.days
        },
        date: {
            $lte: attendance.ofDate
        },
        toDate: {
            $gte: attendance.ofDate
        },
        status: 'approved'
    }).populate('leaveType')

    if (!leave) {
        return
    }

    const user = await users.get(attendance.employee, context)

    let message = {
        data: {
            leave: {
                id: leave.id,
                days: leave.days,
                type: {
                    id: leave.leaveType.id,
                    code: leave.leaveType.code,
                    name: leave.leaveType.name
                }
            },
            attendance: {
                id: attendance.id,
                date: attendance.ofDate,
                count: attendance.count
            },
            user: {
                id: user.id,
                name: user.name,
                code: user.code,
                role: { id: user.role.id }
            }
        },
        modes: config.action.modes,
        options: {
            priority: config.action.priority
        }
    }

    switch (config.action.type) {
    case 'notify-supervisor':
        message.to = await users.get(user.supervisor, context)
        message.template = 'employee-came-on-leave'
        break
    }

    await sendIt.dispatch(message, context)
}
