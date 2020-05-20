'use strict'
const users = require('../../../../services/employee-getter')
const gateway = require('@open-age/gateway-client')

exports.process = async (leave, context) => {
    let supervisor = await users.get(leave.employee.supervisor, context)

    if (!supervisor) {
        return
    }

    gateway.tasks.create({
        template: {
            code: 'ams-leave-approval'
        },
        entity: {
            type: 'employee',
            id: leave.employee.code,
            name: leave.employee.name
        },
        meta: {
            leave: {
                id: leave.id,
                date: leave.date,
                toDate: leave.toDate,
                days: leave.days,
                reason: leave.reason,
                user: {
                    profile: {
                        firstName: leave.employee.profile.firstName || leave.employee.name,
                        lastName: leave.employee.profile.lastName
                    }
                },
                type: {
                    code: leave.leaveType.code,
                    name: leave.leaveType.name
                }
            },
            members: {
                hr: '',
                supervisor: supervisor.email,
                it: ''
            }
        },
        externalId: leave.id
    }, context)
}
