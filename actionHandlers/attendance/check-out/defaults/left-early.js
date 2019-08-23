'use strict'
const moment = require('moment')
const db = require('../../../../models')
const users = require('../../../../services/employee-getter')
const sendIt = require('@open-age/send-it-client')

const getConfig = (context) => {
    const orgConfig = context.getConfig('attendance.checkOut.alert.early')

    if (!orgConfig) { return }
    let config = {
        trigger: {
            count: 5,
            period: 30, // in days
            minutes: 15,
            shiftCount: undefined // no of shifts worked
        },
        action: {
            type: 'notify-supervisor',
            priority: 'high',
            modes: { push: true }
        }
    }

    if (orgConfig.trigger) {
        if (orgConfig.trigger.count) {
            config.trigger.count = orgConfig.trigger.count
        }

        if (orgConfig.trigger.period) {
            config.trigger.period = orgConfig.trigger.period
        }

        if (orgConfig.trigger.minutes) {
            config.trigger.minutes = orgConfig.trigger.minutes
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
    if (!attendance.early) {
        return
    }

    let config = getConfig(context)
    if (!config) return

    if (config.trigger.shiftCount && attendance.count >= config.trigger.shiftCount) {
        return
    }

    let from = moment().subtract(config.trigger.period, 'days').startOf('day').toDate()

    let where = {
        employee: attendance.employee,
        ofDate: from,
        checkOut: {
            $exists: true
        },
        early: {
            $gte: config.trigger.minutes
        }
    }

    let count = await db.attendance.count(where)

    if (count < config.trigger.count) {
        return null
    }

    const user = await users.get(attendance.employee, context)

    let message = {
        data: {
            attendance: {
                id: attendance.id,
                checkOut: attendance.checkOut,
                early: attendance.early,
                minutes: attendance.minutes,
                count: count,
                period: config.trigger.period
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
        message.template = 'employee-left-early-again'
        break

    case 'apply-leave':
        message.to = user
        message.template = 'apply-leave-as-early'
        break
    }

    await sendIt.dispatch(message, context)
}
