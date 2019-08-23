'use strict'

const users = require('../../../../services/employee-getter')
const sendIt = require('@open-age/send-it-client')

const getConfig = (context) => {
    let config = {
        action: {
            type: 'notify-user',
            priority: 'high',
            modes: { push: true, email: true }
        }
    }

    return config
}

exports.process = async (leave, context) => {
    let config = getConfig(context)

    const user = await users.get(leave.employee, context)

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
    case 'notify-user':
        message.to = user
        message.template = 'your-leave-was-rejected'
        break
    }

    await sendIt.dispatch(message, context)
}
