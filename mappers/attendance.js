'use strict'

var timeLogMapper = require('./timeLog')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        status: entity.status,
        // lastUpdated: entity.ofDate,
        checkIn: entity.checkIn,
        checkOut: entity.checkOut,
        checkOutExtend: entity.checkOutExtend,
        ofDate: entity.ofDate,
        hoursWorked: entity.hoursWorked || 0,
        minsWorked: entity.minsWorked || 0
    }

    if (entity.shift) {
        if (entity.shift._doc) {
            model.shift = {
                id: entity.shift.id,
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

            if (entity.shift.shiftType) {
                model.shift.shiftType = {}
                if (entity.shift.shiftType._doc) {
                    model.shift.shiftType = {
                        id: entity.shift.shiftType.id,
                        name: entity.shift.shiftType.name,
                        code: entity.shift.shiftType.code,
                        unitsPerDay: entity.unitsPerDay,
                        startTime: entity.shift.shiftType.startTime,
                        endTime: entity.shift.shiftType.endTime
                    }
                } else {
                    model.shift.shiftType.id = entity.shift.shiftType.toString()
                }
            }
        } else {
            model.shift = {
                id: entity.shift.toString()
            }
        }
    }

    if (entity.timeLogs && entity.timeLogs.length) {
        model.timeLogs = []

        entity.timeLogs.forEach(item => {
            model.timeLogs.push(timeLogMapper.toModel(item))
        })
    }

    // if (entity.employee) {
    //     if (entity.employee._doc) {
    //         model.employee = {
    //             id: entity.employee.id,
    //             name: entity.employee.name,
    //             code: entity.employee.code
    //         };
    //     } else {
    //         model.employee = {
    //             id: entity.employee.toString()
    //         };
    //     }
    // }

    // if (!_.isElement(entity.timeLogs)) {
    //     model.timeLogs = [];
    //     _(entity.timeLogs).each(timeLog => {
    //         model.timeLogs.push({
    //             id: timeLog.id,
    //             date: timeLog.date,
    //             type: timeLog.type
    //         });
    //     });

    //     // if (model.timeLogs.length === 2) {
    //     //     model.hoursWorked = moment(model.timeLogs[1].date).diff(moment(model.timeLogs[0].date), 'hours');
    //     // }
    // }

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
