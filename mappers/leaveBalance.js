'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        units: entity.units,
        days: entity.leaveType.unitsPerDay ? ((Math.trunc((entity.units / entity.leaveType.unitsPerDay) * 10)) / 10) : 0,
        daysAvailed: entity.leaveType.unitsPerDay ? ((Math.trunc(((entity.unitsAvailed || entity.units) / entity.leaveType.unitsPerDay) * 10)) / 10) : 0,
        approvedLeavesCount: entity.approvedLeaves || 0,
        status: entity.status
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

    model.journals = []

    if (entity.journals && entity.journals.length) {
        entity.journals.forEach(item => {
            let journal = {
                date: item.date,
                units: item.units,
                comment: item.comment
            }

            if (item.entity) {
                journal.entity = {
                    id: item.entity.id,
                    type: item.entity.type
                }
            }
            if (item.meta) {
                journal.meta = item.meta
            }
            model.journals.push(journal)
        })
    }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
