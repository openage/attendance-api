'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        days: entity.leaveType.unitsPerDay ? ((Math.trunc((entity.units / entity.leaveType.unitsPerDay) * 10)) / 10) : 0,
        daysAvailed: entity.leaveType.unitsPerDay ? ((Math.trunc(((entity.unitsAvailed || entity.units) / entity.leaveType.unitsPerDay) * 10)) / 10) : 0,
        approvedLeavesCount: entity.approvedLeaves || 0
    }

    // let myLeaveBalance = _.each(leaveBalances, function(leaveBalance) {

    // });

    if (entity.leaveType) {
        if (entity.leaveType._doc) {
            model.leaveType = {
                id: entity.leaveType.id,
                name: entity.leaveType.name,
                code: entity.leaveType.code,
                unitsPerDay: entity.leaveType.unitsPerDay || 0,
                unlimited: entity.leaveType.unlimited,
                monthlyLimit: entity.leaveType.monthlyLimit,
                periodicity: entity.leaveType.periodicity,
                carryForward: entity.leaveType.carryForward

            }
        } else {
            model.leaveType = entity.leaveType.toString()
        }
    }
    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
