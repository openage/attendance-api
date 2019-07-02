'use strict'
const db = require('../../../../models')

const leaveBalanceService = require('../../../../services/leave-balances')

exports.process = async (data, context) => {
    let employee = await db.employee.findById(data.id)

    let leaveTypes = await db.leaveType.find({
        organization: context.organization.id
    })

    for (const leaveType of leaveTypes) {
        await leaveBalanceService.get({ leaveType: leaveType, employee: employee }, context)
    }
}
