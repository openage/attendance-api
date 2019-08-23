'use strict'
const users = require('../../../../services/employee-getter')
const sendIt = require('@open-age/send-it-client')

const getConfig = (context) => {
    let config = {
        action: {
            type: 'notify-supervisor',
            priority: 'high',
            modes: { push: true, email: true }
        }
    }

    return config
}

exports.process = async (leave, context) => {
    let config = getConfig(context)

    const user = await users.get(leave.employee, context)

    if (user.supervisor.id === context.user.id) {
        context.logger.debug('not sending message - reaon:action by user')
        return
    }

    let message = {
        data: {
            leave: {
                id: leave.id,
                date: leave.date,
                days: leave.days,
                type: {
                    id: leave.leaveType.id,
                    code: leave.leaveType.code,
                    name: leave.leaveType.name
                },
                status: leave.status
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
        message.to = await users.get(user, context)
        message.template = 'user-submitted-a-leave'
        break
    }

    await sendIt.dispatch(message, context)
}
