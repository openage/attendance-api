/* eslint-disable indent */
/* eslint-disable quotes */
'use strict'
const db = require('../models')
const _ = require('underscore')
const dates = require('../helpers/dates')
const employeeService = require('../services/employee-getter')

var moment = require('moment')

const allColumns = [
    "employee",
    "employeeModel",
    "leavesSummary",
    "attendances.status",
    "attendances.ofDate",
    "attendances.shift",
    "attendances.shift.shiftType.id",
    "attendances.shift.shiftType.code",
    "attendances.shift.shiftType.startTime",
    "attendances.shift.shiftType.endTime",
    "attendances.shift.shiftType.status",
    "attendances.timeLogs.id",
    "attendances.timeLogs.type",
    "attendances.timeLogs.time",
    "attendances.count",
    "attendances.checkIn",
    "attendances.checkOut",
    "attendances.hoursWorked",
    "attendances.hours",
    "attendances.minutes",
    "attendances.checkInStatus",
    "attendances.checkOutStatus",
    "attendances.firstHalfStatus",
    "attendances.secondHalfStatus",
    "attendances.late",
    "attendances.early",
    "leaves",
    "attendanceSummary",
    "shiftSummary",
    "_id"
]

const summaryColumns = [
    "employee",
    "employeeModel",
    "leavesSummary",
    "attendanceSummary",
    "shiftSummary",
    "_id"
]

const toEmployeeModel = (employee, context) => {
    let model = {
        id: employee.id || '',
        name: employee.name,
        code: employee.code,
        status: employee.status,
        userType: employee.userType,
        biometricCode: employee.biometricCode,
        designation: employee.designation,
        department: employee.department,
        contractor: employee.contractor,
        division: employee.division,
        pf: (employee.config && employee.config.pf) ? employee.config.pf : '',
        esi: (employee.config && employee.config.esi) ? employee.config.esi : '',
        fatherName: employee.fatherName
    }
    if (employee.supervisor) {
        model.supervisor = {
            id: employee.supervisor.id || '',
            name: employee.supervisor.name || '',
            code: employee.supervisor.code || ''
        }
    }

    return model
}

const toLeaveModel = entity => {
    if (!entity.leaveType) {
        return
    }

    var model = {
        id: entity.id,
        date: entity.date,
        toDate: entity.toDate,
        isPlanned: entity.isPlanned,
        days: entity.days,
        status: entity.status,
        reason: entity.reason,
        comment: entity.comment
    }

    if (entity.start) {
        model.start = {
            first: entity.start.first,
            second: entity.start.second
        }
    }

    if (entity.end) {
        model.end = {
            first: entity.end.first,
            second: entity.end.second
        }
    }

    if (entity.leaveType && entity.leaveType._doc) {
        if (entity.leaveType.unlimited) {
            model.days = entity.units
        } else {
            model.days = entity.leaveType.unitsPerDay ? (Math.trunc((entity.units / entity.leaveType.unitsPerDay) * 10) / 10) : 0
        }

        model.leaveType = {
            id: entity.leaveType.id,
            code: entity.leaveType.code,
            name: entity.leaveType.name
        }
    }

    return model
}

const toAttendanceModel = entity => {
    var model = {
        id: entity.id || entity._id,
        ofDate: entity.ofDate,

        checkIn: entity.checkIn,
        checkOut: entity.checkOut,

        status: entity.status,
        checkOutExtend: entity.checkOutExtend,
        isContinue: entity.isContinue,

        firstHalfStatus: entity.firstHalfStatus,
        secondHalfStatus: entity.secondHalfStatus,

        checkInStatus: entity.checkInStatus,
        checkOutStatus: entity.checkOutStatus,

        count: entity.count || 0,
        hours: entity.hours,
        minutes: entity.minutes,

        clocked: entity.clocked,
        overTime: entity.overTime,

        late: entity.late,
        early: entity.early,

        timeLogs: [],

        comment: entity.comment
    }

    if (entity.shift && (entity.shift._doc || entity.shift.date)) {
        model.shift = {
            id: entity.shift.id || entity.shift._id,
            status: entity.shift.status
        }

        if (entity.shift.holiday && entity.shift.holiday._doc) {
            model.shift.holiday = {
                name: entity.shift.holiday.name
            }
        }

        let shiftType = entity.shift.shiftType
        if (shiftType && (shiftType._doc || shiftType.code)) {
            model.shift.shiftType = {
                id: shiftType._id,
                code: shiftType.code,
                name: shiftType.name,
                color: shiftType.color || '#000000'
            }
        }
    }

    if (entity.timeLogs && entity.timeLogs.length) {
        entity.timeLogs.forEach(item => {
            if (!item.ignore) {
                model.timeLogs.push({
                    id: item.id,
                    type: item.type,
                    time: item.time
                })
            }
        })
    }

    return model
}

const getSummary = async (date, employee, context) => {
    let entity = await db.monthSummary.findOne({
        month: dates.date(date).bom(),
        employee: employee
    })

    if (entity) {
        return entity
    }
    entity = new db.monthSummary({
        month: dates.date(date).bom(),
        employee: employee,
        organization: context.organization
    })

    await set(entity, context)
    await entity.save()
    return entity
}

const calculate = (entity, context) => {
    let attendanceSummary = {
        count: 0,
        present: 0,
        absent: 0,
        holiday: 0,
        weekOff: 0,
        missedSwipes: 0,
        firstHalfPresent: 0,
        secondHalfPresent: 0,
        firstHalfAbsent: 0,
        secondHalfAbsent: 0,

        leaves: 0,
        minutes: 0,
        overTime: 0,
        overTimeCount: 0,

        shifts: 0,
        lateCount: 0,
        earlyCount: 0
    }

    let shiftSummary = []
    let leavesSummary = []

    entity.leaves.forEach(item => {
        let groupedLeave = leavesSummary.find(s => s.code.toLowerCase() === item.leaveType.code.toLowerCase())
        if (!groupedLeave) {
            groupedLeave = {
                code: item.leaveType.code,
                count: 0
            }
            leavesSummary.push(groupedLeave)
        }

        if (item.status === 'approved') {
            groupedLeave.count += item.days
        }
    })

    entity.attendances.forEach((item) => {
        attendanceSummary.count++

        if (item.minutes) {
            attendanceSummary.minutes += item.minutes
        }

        if (item.overTime) {
            attendanceSummary.overTime += item.overTime

            attendanceSummary.overTimeCount++
        }

        if (item.count >= 1) { // TODO: make it configurable
            attendanceSummary.shifts++
        }

        let shift = shiftSummary.find(s => s.name === item.shift.shiftType.name)
        if (!shift) {
            shift = {
                name: item.shift.shiftType.name,
                count: 0
            }
            shiftSummary.push(shift)
        }

        shift.count++

        switch (item.status) {
            // case 'present':
            //     attendanceSummary.present++
            //     break
            // case 'absent':
            //     attendanceSummary.absent++
            //     break

            case 'weekOff':
                attendanceSummary.weekOff++
                break

            case 'onLeave':
                attendanceSummary.leaves++
                break

            case 'holiday':
                attendanceSummary.holiday++
                break
        }

        switch (item.checkInStatus) {
            case 'missed':
                attendanceSummary.missedSwipes++
                break
            case 'late':
                attendanceSummary.lateCount++
                break
            case 'early':
                break
        }

        switch (item.checkOutStatus) {
            case 'missed':
                attendanceSummary.missedSwipes++
                break
            case 'late':
                break
            case 'early':
                attendanceSummary.earlyCount++
                break
        }

        let presentCodes = context.getConfig('attendance.present.codes')
        if (item.firstHalfStatus && presentCodes.indexOf(item.firstHalfStatus.toUpperCase()) !== -1) {
            attendanceSummary.firstHalfPresent++
        }

        if (item.secondHalfStatus && presentCodes.indexOf(item.secondHalfStatus.toUpperCase()) !== -1) {
            attendanceSummary.secondHalfPresent++
        }
        if (item.status !== 'holiday') {
            if (item.firstHalfStatus && 'A'.indexOf(item.firstHalfStatus.toUpperCase()) !== -1) {
                attendanceSummary.firstHalfAbsent++
            }
        }

        if (item.status !== 'holiday' && (item.secondHalfStatus && 'A'.indexOf(item.secondHalfStatus.toUpperCase()) !== -1)) {
            attendanceSummary.secondHalfAbsent++
        }
        attendanceSummary.present = (attendanceSummary.firstHalfPresent + attendanceSummary.secondHalfPresent) / 2
        attendanceSummary.absent = (attendanceSummary.firstHalfAbsent + attendanceSummary.secondHalfAbsent) / 2
    })

    entity.leavesSummary = leavesSummary
    entity.attendanceSummary = attendanceSummary
}

const setEmployee = async (entity, employee, context) => {
    entity.employeeModel = toEmployeeModel(employee, context)

    return employee
}

const setLeaves = async (entity, context) => {
    entity.leaves = []
    let leaves = await db.leave.find({
        employee: entity.employee,
        status: 'approved',
        date: {
            $gte: dates.date(entity.month).bom(),
            $lte: dates.date(entity.month).eom()
        }
    }).populate('leaveType')

    if (leaves && leaves.length) {
        leaves.forEach(item => {
            entity.leaves.push(toLeaveModel(item))
        })
    }
}

const set = async (entity, context) => {
    let employee = await employeeService.get(entity.employee, context)

    setEmployee(entity, employee, context)

    entity.attendances = []

    await setLeaves(entity, context)

    entity.attendances = []
    let attendances = await db.attendance.find({
        employee: entity.employee,
        ofDate: {
            $gte: dates.date(entity.month).bom(),
            $lte: dates.date(entity.month).eom()
        }
    }).populate([{
        path: 'shift',
        populate: {
            path: 'shiftType'
        }
    }, {
        path: 'timeLogs'
    }])

    if (attendances && attendances.length) {
        attendances.forEach(item => {
            entity.attendances.push(toAttendanceModel(item))
        })
    }

    entity.status = 'unlock'

    calculate(entity, context)
}

exports.update = async (date, employee, context) => {
    let entity = await db.monthSummary.findOne({
        month: dates.date(date).bom(),
        employee: employee
    })

    if (!entity) {
        entity = new db.monthSummary({
            month: dates.date(date).bom(),
            employee: employee,
            organization: context.organization
        })
    }
    await set(entity, context)
    await entity.save()

    return entity
}

exports.updateEmployee = async (employee, context) => {
    let entity = await getSummary(new Date(), employee, context)

    setEmployee(entity, employee, context)

    await entity.save()

    return entity
}

exports.updateLeaves = async (leave, context) => {
    let entity = await getSummary(leave.date, leave.employee, context)

    await setLeaves(entity, context)

    calculate(entity, context)

    await entity.save()
    return entity
}

exports.addAttendance = async (attendance, context) => {
    let entity = await getSummary(attendance.ofDate, attendance.employee, context)
    entity.attendances = entity.attendances || []

    let model = toAttendanceModel(attendance)

    let attendances = []
    let updated = false
    entity.attendances.forEach(item => {
        if (item.id === model.id) {
            attendances.push(model)
            updated = true
        } else {
            attendances.push(item)
        }
    })

    if (!updated) {
        attendances.sort((a, b) => moment(a.ofDate).isAfter(b.ofDate) ? 1 : -1)
    }

    entity.attendances = attendances

    calculate(entity, context)

    await entity.save()
    return entity
}
exports.search = async (params, pageInput, context) => {
    let month = params.dates && params.dates.from ? params.dates.from : new Date()
    let query = {
        organization: global.toObjectId(context.organization.id),
        month: dates.date(month).bom(),
        'employeeModel.status': 'active'
    }

    if (params.employee) {
        if (params.employee.name) {
            query['employeeModel.name'] = {
                $regex: params.employee.name,
                $options: 'i'
            }
        }

        if (params.employee.code) {
            query['employeeModel.code'] = params.employee.code
        } else {
            query['employeeModel.code'] = { $ne: 'default' }
        }

        if (params.employee.supervisor) {
            query['employeeModel.supervisor.id'] = params.employee.supervisor.id
        }

        if (params.employee.userTypes) {
            let userTypesList = []
            let queryUserTypesList = params.employee.userTypes
            _.each(queryUserTypesList, (userType) => {
                userTypesList.push(userType.code.toLowerCase())
            })
            query['employeeModel.userType'] = {
                $in: userTypesList
            }
        }

        if (params.employee.departments) {
            let departmentList = []
            let queryDepartmentList = params.employee.departments
            _.each(queryDepartmentList, (department) => {
                departmentList.push(department.name)
            })
            query['employeeModel.department'] = {
                $in: departmentList
            }
        }
        if (params.employee.divisions) {
            let divisionList = []
            let queryDivisionList = params.employee.divisions
            _.each(queryDivisionList, (division) => {
                divisionList.push(division.name)
            })
            query['employeeModel.division'] = {
                $in: divisionList
            }
        }

        if (params.employee.designations) {
            let designationList = []
            let queryDesignationList = params.employee.designations
            _.each(queryDesignationList, (designation) => {
                designationList.push(designation.name)
            })
            query['employeeModel.designation'] = {
                $in: designationList
            }
        }

        if (params.employee.contractors) {
            let contractorList = []
            let queryContractorsList = params.employee.contractors
            _.each(queryContractorsList, (contractor) => {
                contractorList.push(contractor.name.toLowerCase())
            })
            query['employeeModel.contractor'] = {
                $in: contractorList
            }
        }
        if (params.userTypes) {
            let userTypesList = []
            let queryUserTypesList = params.userTypes
            _.each(queryUserTypesList, (userType) => {
                userTypesList.push(userType.toLowerCase())
            })
            query['employeeModel.userType'] = {
                $in: userTypesList
            }
        }
        if (params.departments) {
            let departmentList = []
            let queryDepartmentList = params.departments
            _.each(queryDepartmentList, (department) => {
                departmentList.push(department)
            })
            query['employeeModel.department'] = {
                $in: departmentList
            }
        }
        if (params.divisions) {
            let divisionList = []
            let queryDivisionList = params.divisions
            _.each(queryDivisionList, (division) => {
                divisionList.push(division)
            })
            query['employeeModel.division'] = {
                $in: divisionList
            }
        }

        if (params.designations) {
            let designationList = []
            let queryDesignationList = params.designations
            _.each(queryDesignationList, (designation) => {
                designationList.push(designation)
            })
            query['employeeModel.designation'] = {
                $in: designationList
            }
        }

        if (params.contractors) {
            let contractorList = []
            let queryContractorsList = params.contractors
            _.each(queryContractorsList, (contractor) => {
                contractorList.push(contractor.toLowerCase())
            })
            query['employeeModel.contractor'] = {
                $in: contractorList
            }
        }
    }

    let columns = []

    if (pageInput.columns) {
        columns = pageInput.columns
    } else {
        columns = allColumns
    }

    let model = { _id: 1 }

    if (columns.length) {
        for (const column of columns) {
            model[column] = 1
        }
    }

    let total = await db.monthSummary.find(query, { _id: 1 }).count()

    let items = []

    if (pageInput.limit) {
        items = await db.monthSummary.find(query, model).skip(pageInput.skip).limit(pageInput.limit)
    } else {
        let limit = total
        let skip = 0
        items = await db.monthSummary.find(query, model).skip(skip).limit(limit)
    }

    let page = {
        items: items.map(item => {
            // item.get = async () => {
            //     return db.monthSummary.findById(item._id)
            // }

            if (columns && !pageInput.columns.length) {
                return item._id
            }
            return item
        })
    }

    if (pageInput) {
        page.total = total
        page.pageNo = pageInput.pageNo
        page.pageSize = pageInput.limit
    }

    return page
}

exports.getSummary = getSummary
