'use strict'

var timeLogMapper = require('./timeLog')
const shiftTypeMapper = require('./shiftType')

const dates = require('../helpers/dates')

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id || entity._id,
        externalId: entity.externalId,
        status: entity.status,
        checkIn: entity.checkIn,
        checkInStatus: entity.checkInStatus,
        checkOut: entity.checkOut,
        checkOutStatus: entity.checkOutStatus,
        checkOutExtend: entity.checkOutExtend,
        ofDate: entity.ofDate,

        firstHalfStatus: entity.firstHalfStatus,
        secondHalfStatus: entity.secondHalfStatus,
        hoursWorked: entity.hoursWorked || 0,
        minsWorked: entity.minsWorked || 0,

        count: entity.count || 0,
        hours: entity.hours,
        minutes: entity.minutes,
        clocked: entity.clocked,
        late: entity.late,
        early: entity.early,
        overTime: entity.overTime,
        timeLogs: [],
        passes: [],

        needsAction: entity.needsAction,
        comment: entity.comment,
        isContinue: entity.isContinue
        // timeStamp: entity.timeStamp
    }

    // if (!dates.date(entity.ofDate).isPast()) {
    //     if (model.status === 'absent') {
    //         model.status = ' '
    //     }
    // }

    if (entity.shift) {
        if (entity.shift._doc || entity.shift.date) {
            model.shift = {
                id: entity.shift.id || entity.shift._id,
                date: entity.shift.date,
                status: entity.shift.status
            }

            if (entity.shift.holiday) {
                model.shift.holiday = {}
                if (entity.shift.holiday._doc) {
                    model.shift.holiday = {
                        name: entity.shift.holiday.name,
                        date: entity.shift.holiday.date
                    }
                } else {
                    model.shift.holiday.id = entity.shift.holiday.toString()
                }
            }

            let shiftType = entity.shift.shiftType

            if (entity.shiftType && entity.shiftType.code) {
                shiftType = entity.shiftType
            }
            if (shiftType) {
                model.shift.shiftType = {}
                if (shiftType._doc || shiftType.code) {
                    model.shift.shiftType = shiftTypeMapper.toModel(shiftType, context)
                } else {
                    model.shift.shiftType.id = shiftType.toString()
                }
            }
        } else {
            model.shift = {
                id: entity.shift.toString()
            }
        }
    }

    if (entity.timeLogs && entity.timeLogs.length) {
        entity.timeLogs.forEach(item => {
            model.timeLogs.push(timeLogMapper.toModel(item, context))
        })
    }

    if (entity.passes && entity.passes.length) {
        entity.passes.forEach(item => {
            model.passes.push({
                out: timeLogMapper.toModel(item.out, context),
                in: timeLogMapper.toModel(item.in, context)
            })
        })
    }

    if (entity.employee) {
        if (entity.employee._doc || entity.employee.code || entity.employee.name) {
            model.employee = {
                id: entity.employee._id,
                name: entity.employee.name,
                code: entity.employee.code,
                biometricCode: entity.employee.biometricCode,
                designation: entity.employee.designation,
                picData: entity.employee.picData,
                picUrl: entity.employee.picUrl,
                email: entity.employee.email,
                hasTeam: entity.team && entity.team.teamCount > 0
            }
        } else {
            model.employee = {
                id: entity.employee.toString()
            }
        }
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
