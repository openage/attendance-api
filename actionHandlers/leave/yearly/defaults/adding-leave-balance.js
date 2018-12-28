'use strict'
const logger = require('@open-age/logger')('yearly-adding-leave-balance')
const db = require('../../../../models')

const createOrUpdateLeaveBalance = async (leaveType, employee) => {
    const log = logger.start('createOrUpdateLeaveBalance')

    let leaveBalance = await db.leaveBalance.findOne({
        leaveType: leaveType,
        employee: employee
    })

    let unitsGained = 0

    if (leaveType.periodicity && leaveType.periodicity.value) {
        unitsGained = unitsGained + (leaveType.periodicity.value * leaveType.unitsPerDay)
    }
    if (leaveType.carryForward) {
        unitsGained = unitsGained + (leaveType.carryForward * leaveType.unitsPerDay)
    }

    if (!leaveBalance) {
        return new db.leaveBalance({
            leaveType: leaveType,
            employee: employee,
            units: unitsGained,
            unitsAvailed: 0
        }).save()
    }

    leaveBalance.units = unitsGained
    return leaveBalance.save()
}

exports.process = async (data, context, callback) => {
    const log = logger.start('process')

    const leaveType = await db.leaveType.findById(data.id)

    const employees = await db.employee.find({
        organization: context.organization
    })

    await Promise.each(employees, async (employee) => {
        await createOrUpdateLeaveBalance(leaveType, employee)
    })

    return callback()
}
