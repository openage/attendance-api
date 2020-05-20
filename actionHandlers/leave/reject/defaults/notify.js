'use strict'

const users = require('../../../../services/employee-getter')
const userMapper = require('../../../../mappers/user')
const sendIt = require('@open-age/send-it-client')

exports.process = async (leave, context) => {
    let user = await users.get(leave.employee, context)

    if (user.id === context.user.id) {
        context.logger.debug('skipping message: self rejected')
    }

    user = userMapper.toSummary(user, context)

    await sendIt.dispatch({
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
            user: user
        },
        meta: {
            entity: {
                id: leave.id,
                type: 'leave'
            }
        },
        template: {
            code: 'ams-leave-rejected'
        },
        to: {
            role: { id: user.role.id }
        },
        options: {
            priority: 'high',
            modes: { push: true, email: true }
        }
    }, context)
}
