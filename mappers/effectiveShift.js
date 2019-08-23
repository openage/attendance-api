'use strict'

exports.toModel = (entity, context) => {
    let model = {
        id: entity.id,
        shiftType: entity.shiftType,
        employee: entity.employee,
        organization: entity.organization,
        date: entity.date
    }
    return model
}

exports.toEmployeeModel = entity => {
    let model = {
        employee: {
            id: entity._id.toString(),
            name: entity.name,
            code: entity.code,
            biometricCode: entity.biometricCode,
            picUrl: entity.picUrl,
            isDynamicShift: entity.isDynamicShift || false,
            weeklyOff: {
                isConfigured: false
            }
        },
        previousShift: {},
        shifts: []
    }

    if (entity.previousShift) {
        model.previousShift = {
            date: new Date(),
            id: entity.previousShift.id,
            shiftType: {}
        }

        if (entity.previousShift.shiftType) {
            model.previousShift.shiftType = {
                id: entity.previousShift.shiftType.id.toString(),
                name: entity.previousShift.shiftType.name,
                color: entity.previousShift.shiftType.color,
                startTime: entity.previousShift.shiftType.startTime,
                endTime: entity.previousShift.shiftType.endTime
            }
        }
    }

    if (entity.weeklyOff) {
        model.employee.weeklyOff = {
            monday: entity.weeklyOff.monday,
            tuesday: entity.weeklyOff.tuesday,
            wednesday: entity.weeklyOff.wednesday,
            thursday: entity.weeklyOff.thursday,
            friday: entity.weeklyOff.friday,
            saturday: entity.weeklyOff.saturday,
            sunday: entity.weeklyOff.sunday,
            isConfigured: !!entity.weeklyOff.isConfigured
        }
    }
    if (!entity.effectiveShifts) {
        model.shifts.push({
            shiftType: {
                id: entity.shiftType.toString()
            }
        })
    } else {
        entity.effectiveShifts.forEach((effectiveShift) => {
            if (!effectiveShift.shiftType) { return }
            model.shifts.push({
                id: effectiveShift._id.toString(),
                shiftType: {
                    id: effectiveShift.shiftType.id.toString(),
                    name: effectiveShift.shiftType.name,
                    startTime: effectiveShift.shiftType.startTime,
                    endTime: effectiveShift.shiftType.endTime
                },
                date: effectiveShift.date
            })
        })
    }
    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        let model = {
            employee: {
                id: entity._id.toString(),
                name: entity.name,
                code: entity.code,
                designation: entity.designation,
                department: entity.department,
                division: entity.division,
                biometricCode: entity.biometricCode,
                picUrl: entity.picUrl,
                isDynamicShift: entity.isDynamicShift || false,
                weeklyOff: {
                    isConfigured: false
                }
            },
            previousShift: {},
            shifts: [],
            attendances: [],
            leaves: []
        }

        if (entity.previousShift) {
            model.previousShift = {
                date: entity.previousShift.date || new Date(),
                id: entity.previousShift.id,
                shiftType: {}
            }

            if (entity.previousShift.shiftType) {
                model.previousShift.shiftType = {
                    id: entity.previousShift.shiftType.id.toString(),
                    name: entity.previousShift.shiftType.name,
                    color: entity.previousShift.shiftType.color,
                    startTime: entity.previousShift.shiftType.startTime,
                    endTime: entity.previousShift.shiftType.endTime,
                    monday: entity.previousShift.shiftType.monday,
                    tuesday: entity.previousShift.shiftType.tuesday,
                    wednesday: entity.previousShift.shiftType.wednesday,
                    thursday: entity.previousShift.shiftType.thursday,
                    friday: entity.previousShift.shiftType.friday,
                    saturday: entity.previousShift.shiftType.saturday,
                    sunday: entity.previousShift.shiftType.sunday
                }
            }
        }

        if (entity.weeklyOff) {
            model.employee.weeklyOff = {
                monday: entity.weeklyOff.monday,
                tuesday: entity.weeklyOff.tuesday,
                wednesday: entity.weeklyOff.wednesday,
                thursday: entity.weeklyOff.thursday,
                friday: entity.weeklyOff.friday,
                saturday: entity.weeklyOff.saturday,
                sunday: entity.weeklyOff.sunday,
                isConfigured: !!entity.weeklyOff.isConfigured
            }
        }

        if (entity.effectiveShifts) {
            entity.effectiveShifts.forEach((effectiveShift) => {
                if (!effectiveShift.shiftType) { return }
                model.shifts.push({
                    id: effectiveShift._id.toString(),
                    shiftType: {
                        id: effectiveShift.shiftType.id.toString(),
                        name: effectiveShift.shiftType.name,
                        code: effectiveShift.shiftType.code,
                        color: effectiveShift.shiftType.color || '#000000',
                        isDynamic: effectiveShift.shiftType.isDynamic,
                        monday: effectiveShift.shiftType.monday,
                        tuesday: effectiveShift.shiftType.tuesday,
                        wednesday: effectiveShift.shiftType.wednesday,
                        thursday: effectiveShift.shiftType.thursday,
                        friday: effectiveShift.shiftType.friday,
                        saturday: effectiveShift.shiftType.saturday,
                        sunday: effectiveShift.shiftType.sunday
                    },
                    date: effectiveShift.date
                })
            })
        }

        if (entity.attendances) {
            entity.attendances.forEach((attendance) => {
                model.attendances.push({
                    id: attendance && attendance._id.toString(),
                    status: attendance.status,
                    checkIn: attendance.checkIn,
                    checkOut: attendance.checkOut,
                    checkOutExtend: attendance.checkOutExtend,
                    ofDate: attendance.ofDate,
                    hoursWorked: attendance.hoursWorked || 0,
                    minsWorked: attendance.minsWorked || 0,
                    count: attendance.count || 0,
                    comment: attendance.comment,
                    isContinue: attendance.isContinue || false,
                    shift: {
                        id: attendance.shift && attendance.shift.id,
                        date: attendance.shift && attendance.shift.date,
                        status: attendance.shift && attendance.shift.status,
                        shiftType: {
                            id: attendance.shift.shiftType && attendance.shift.shiftType.id,
                            name: attendance.shift.shiftType && attendance.shift.shiftType.name,
                            code: attendance.shift.shiftType && attendance.shift.shiftType.code
                        }
                    }
                })
            })
        }

        if (entity.leaves) {
            entity.leaves.forEach((leave) => {
                if (!leave.leaveType) { return }

                if (leave.leaveType.unlimited) {
                    leave.days = leave.units
                } else {
                    leave.days = leave.leaveType.unitsPerDay ? (Math.trunc((leave.units / leave.leaveType.unitsPerDay) * 10) / 10) : 0
                }

                let leaveModel = {
                    id: leave._id.toString(),
                    date: leave.date,
                    toDate: leave.toDate,
                    isPlanned: leave.isPlanned,
                    days: leave.days,
                    leaveType: {
                        id: leave.leaveType.id,
                        name: leave.leaveType.name,
                        code: leave.leaveType.code
                    },
                    reason: leave.reason,
                    status: leave.status
                }

                if (leave.start) {
                    leaveModel.start = {
                        first: leave.start.first,
                        second: leave.start.second
                    }
                }

                if (leave.end) {
                    leaveModel.end = {
                        first: leave.end.first,
                        second: leave.end.second
                    }
                }
                model.leaves.push(leaveModel)
            })
        }
        return model
    })
}
