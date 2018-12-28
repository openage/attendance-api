'use strict'
let _ = require('underscore')

exports.toModel = entity => {
    var model = {
        id: entity.id,
        reportingOfficer: {}
    }

    if (entity.supervisor) {
        model.reportingOfficer = {
            id: entity.supervisor.id,
            name: entity.supervisor.name,
            code: entity.supervisor.code,
            picData: entity.supervisor.picData,
            picUrl: entity.supervisor.picUrl === '' ? null : entity.supervisor.picUrl,
            designation: entity.supervisor.designation,
            phone: entity.supervisor.phone,
            email: entity.supervisor.email
        }
    }
    model.members = []

    if (!_.isEmpty(entity.commanders)) {
        _(entity.commanders).each(function (commander) {
            if (commander.employee) {
                var employee = {
                    level: commander.level || 1,
                    employee: {
                        id: commander.employee.id || commander.employee._id,
                        name: commander.employee.name,
                        code: commander.employee.code,
                        picData: commander.employee.picData,
                        picUrl: commander.employee.picUrl === '' ? null : commander.employee.picUrl,
                        designation: commander.employee.designation,
                        phone: commander.employee.phone,
                        email: commander.employee.email
                    },
                    totalLeaveBalance: commander.totalLeaveBalance,
                    attendance: {}
                }

                // employee.appliedLeaves = [];
                // if (!_.isElement(commander.appliedLeaves)) {

                //     _(commander.appliedLeaves).each(leave => {
                //         employee.appliedLeaves.push({
                //             id: leave.id,
                //             date: leave.date,
                //             isPlanned: leave.isPlanned,
                //             days: leave.units / leave.leaveType.unitsPerDay,
                //             status: leave.status,
                //             reason: leave.reason,
                //             comment: leave.comment
                //         });
                //     });
                // }

                if (commander.attendance) {
                    employee.attendance = {
                        id: commander.attendance.id,
                        status: commander.attendance.status,
                        checkIn: commander.attendance.checkIn,
                        checkOut: commander.attendance.checkOut,
                        hoursWorked: commander.attendance.hoursWorked,
                        minsWorked: commander.attendance.minsWorked,
                        recentMostTimeLog: {}
                    }

                    if (commander.attendance.recentMostTimeLog) {
                        if (commander.attendance.recentMostTimeLog._doc) {
                            employee.attendance.recentMostTimeLog = {
                                id: commander.attendance.recentMostTimeLog.id,
                                type: commander.attendance.recentMostTimeLog.type,
                                device: commander.attendance.recentMostTimeLog.device,
                                employee: commander.attendance.recentMostTimeLog.employee,
                                time: commander.attendance.recentMostTimeLog.time,
                                source: commander.attendance.recentMostTimeLog.source
                            }
                        } else {
                            model.attendance.recentMostTimeLog = {
                                id: commander.attendance.recentMostTimeLog.toString()
                            }
                        }
                    }
                }

                model.members.push(employee)
            } else {
                model.members.push({
                    level: commander.level,
                    employee: {
                        id: commander.employee.toString()
                    }
                })
            }
        })
    }

    model.totalRecords = entity.totalRecordsCount || 0

    return model
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
