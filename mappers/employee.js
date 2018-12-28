'use strict'
let _ = require('underscore')
let moment = require('moment')

exports.toModel = entity => {
    var model = {
        id: entity.id || entity._id.toString(),
        name: entity.name,
        code: entity.code,
        designation: entity.designation,
        picData: entity.picData,
        picUrl: entity.picUrl === '' ? null : entity.picUrl,
        email: entity.email,
        phone: entity.phone,
        tags: entity.tags,
        totalLeaveBalance: entity.totalLeaveBalance,
        userType: entity.userType || 'normal',
        absentDays: entity.absentDays,
        absentDates: entity.absentDates,
        dob: entity.dob,
        gender: entity.gender,
        presentDays: entity.presentDays,
        fingerPrints: entity.fingerPrints,
        isDynamicShift: entity.isDynamicShift,
        weeklyOff: {
            isConfigured: false
        },
        devices: []
    }

    if (entity.weeklyOff) {
        model.weeklyOff = {
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
    model.abilities = {}
    if (!_.isEmpty(entity.abilities)) {
        for (var key in entity._doc.abilities) {
            model.abilities[key] = entity.abilities[key]
        }
    }

    if (entity.devices && entity.devices.length) {
        model.devices = entity.devices.map((device) => {
            return {
                id: device.id,
                status: device.status
            }
        })
    }

    if (entity.organization) {
        if (entity.organization._doc) {
            model.organization = {
                id: entity.organization.id,
                name: entity.organization.name,
                code: entity.organization.code,
                onBoardingStatus: entity.organization.onBoardingStatus || 'start'
            }
        } else {
            model.organization = {
                id: entity.organization.toString()
            }
        }
    }
    model.device = {}
    if (entity.device && entity.device.id) {
        model.device = {
            id: entity.device.id
        }
    }

    if (entity.shiftType) {
        if (entity.shiftType._doc) {
            model.shiftType = {
                id: entity.shiftType.id,
                name: entity.shiftType.name,
                code: entity.shiftType.code,
                startTime: entity.shiftType.startTime,
                endTime: entity.shiftType.endTime
            }
        } else {
            model.shiftType = {
                id: entity.shiftType.toString()
            }
        }
    }

    if (entity.supervisor && entity.supervisor.status == 'active') {
        if (entity.supervisor._doc) {
            model.supervisor = {
                name: entity.supervisor.name,
                code: entity.supervisor.code
            }
        } else {
            model.supervisor = {
                id: entity.supervisor.toString()
            }
        }
    }

    model.leaveBalances = []
    if (entity.leaveBalances) {
        _.each(entity.leaveBalances, leaveBalance => {
            model.leaveBalances.push({
                leaveType: {
                    id: leaveBalance.leaveType.id,
                    name: leaveBalance.leaveType.name,
                    code: leaveBalance.leaveType.code,
                    unlimited: leaveBalance.leaveType.unlimited
                },
                days: Math.trunc((leaveBalance.units / leaveBalance.leaveType.unitsPerDay) * 10) / 10,
                daysAvailed: Math.trunc((leaveBalance.unitsAvailed / leaveBalance.leaveType.unitsPerDay) * 10) / 10
            })
        })
    }

    if (entity.attendance) {
        model.attendance = {
            id: entity.attendance.id,
            status: entity.attendance.status,
            checkIn: entity.attendance.checkIn,
            checkOut: entity.attendance.checkOut,
            hoursWorked: entity.attendance.hoursWorked,
            minsWorked: entity.attendance.minsWorked,
            recentMostTimeLog: {},
            shift: {}
        }

        if (entity.attendance.shift) {
            model.attendance.shift = {
                status: entity.attendance.shift.status,
                date: entity.attendance.shift.date
            }
        }

        if (entity.attendance.timeLogs && entity.attendance.timeLogs.length) {
            entity.attendance.timeLogs.forEach(item => {
                if (!entity.attendance.recentMostTimeLog || entity.attendance.recentMostTimeLog.time < item.time) {
                    entity.attendance.recentMostTimeLog = item
                }
            })
        }

        if (entity.attendance.recentMostTimeLog) {
            if (entity.attendance.recentMostTimeLog._doc) {
                model.attendance.recentMostTimeLog = {
                    id: entity.attendance.recentMostTimeLog.id,
                    type: entity.attendance.recentMostTimeLog.type,
                    device: entity.attendance.recentMostTimeLog.device,
                    employee: entity.attendance.recentMostTimeLog.employee,
                    time: entity.attendance.recentMostTimeLog.time,
                    source: entity.attendance.recentMostTimeLog.source
                }
            } else {
                model.attendance.recentMostTimeLog = {
                    id: entity.attendance.recentMostTimeLog.toString()
                }
            }
        }
        if (entity.attendance.team) {
            if (entity.today) {
                model.team = {
                    total: entity.attendance.team.teamCount ? (entity.attendance.team.teamCount) : 0,
                    late: entity.attendance.team.teamCount ? entity.attendance.team.lateCount ? (entity.attendance.team.lateCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    active: entity.attendance.team.teamCount ? entity.attendance.team.activeCount ? (entity.attendance.team.activeCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    absent: entity.attendance.team.teamCount ? entity.attendance.team.absentCount ? (entity.attendance.team.absentCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    leave: entity.attendance.team.teamCount ? entity.attendance.team.leaveCount ? (entity.attendance.team.leaveCount / entity.attendance.team.teamCount) * 100 : 0 : 0
                }
            } else {
                model.team = {
                    total: entity.attendance.team.teamCount ? (entity.attendance.team.teamCount) : 0,
                    late: entity.attendance.team.teamCount ? entity.attendance.team.lateCount ? (entity.attendance.team.lateCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    present: entity.attendance.team.teamCount ? entity.attendance.team.presentCount ? (entity.attendance.team.presentCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    absent: entity.attendance.team.teamCount ? entity.attendance.team.absentCount ? (entity.attendance.team.absentCount / entity.attendance.team.teamCount) * 100 : 0 : 0,
                    leave: entity.attendance.team.teamCount ? entity.attendance.team.leaveCount ? (entity.attendance.team.leaveCount / entity.attendance.team.teamCount) * 100 : 0 : 0
                }
            }
        }
    }

    return model
}

exports.toFullModel = entity => {
    let data = exports.toModel(entity)
    data.token = entity.token
    return data
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        if (entity) {
            return exports.toModel(entity)
        }
    })
}
