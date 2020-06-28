'use strict'
const mapper = require('../mappers/effectiveShift')
const effectiveShifts = require('../services/effectiveShifts')
const attendanceService = require('../services/attendances')
const employeeService = require('../services/employee-getter')
const db = require('../models')
const offline = require('@open-age/offline-processor')

const dates = require('../helpers/dates')
const paging = require('../helpers/paging')

exports.update = async (req) => {
    let date = dates.date(req.body.date).bod()
    let employee = await employeeService.get(req.params.id, req.context)

    let shiftType = {
        id: (req.body.newShiftType || req.body.shiftType).id
    }

    if (dates.date(date).isToday()) {
        let attendance = await attendanceService.setShift(date, employee, shiftType, req.context)
        return {
            attendance: {
                id: attendance.id
            }
        }
    }

    let effectiveShift = await db.effectiveShift.findOne({
        employee: employee.id,
        date: date
    })

    if (!effectiveShift) {
        effectiveShift = new db.effectiveShift({
            date: date,
            employee: employee.id,
            organization: req.context.organization.id,
            supervisor: req.context.user.id
        })
    }

    effectiveShift.shiftType = shiftType.id

    await effectiveShift.save()

    return {
        id: effectiveShift.id
    }
}

exports.delete = async (req) => {
    let entity = await db.effectiveShift.findById(req.params.id)
    await entity.remove()

    return {
        id: entity.id
    }
}

exports.create = async (req) => {
    let effectiveShift = await effectiveShifts.create(req.body, req.context)
    return mapper.toModel(effectiveShift, req.context)
}

exports.bulk = async (req) => {
    for (const item of req.body.items) {
        await effectiveShifts.create(item, req.context)
    }

    return `added/updated '${req.body.items.length}' shifts`
}

exports.reset = async (req) => {
    await offline.queue('shift-type', 'reset', {}, req.context)

    return {
        message: 'submitted'
    }
}

exports.search = async (req, res) => {
    let page = paging.extract(req)

    let fromDate = dates.date(req.query.fromDate).bod()

    let toDate = dates.date(fromDate).nextWeek()

    let employeeQuery = {
        organization: global.toObjectId(req.context.organization.id),
        status: 'active',
        supervisor: req.context.user
    }

    if (req.query.code) {
        employeeQuery.code = req.query.code
    }

    if (req.query.name) {
        employeeQuery.name = {
            $regex: '^' + req.query.name,
            $options: 'i'
        }
    }

    if (req.query.userTypes) {
        let userTypesList = []
        let queryUserTypesList = req.query.userTypes.split(',')
        queryUserTypesList.forEach((userType) => {
            userTypesList.push(userType)
        })
        employeeQuery['userType'] = {
            $in: userTypesList
        }
    }

    if (req.query.supervisorId) {
        employeeQuery['supervisor'] = global.toObjectId(req.query.supervisorId)
    }

    if (req.query.supervisor) {
        let supervisor = await db.employee.findOne({ code: req.query.supervisor, organization: req.context.organization.id })
        employeeQuery['supervisor'] = supervisor.id
    }

    if (req.query.shiftType) {
        let shiftIds = []
        let queryShifts = req.query.shiftType.split(',')
        queryShifts.forEach(shift => {
            shiftIds.push(global.toObjectId(shift))
        })
        employeeQuery['shiftType'] = {
            $in: shiftIds
        }
    }

    if (req.query.divisions) {
        let divisionList = []
        let queryDivisionList = req.query.divisions.split(',')
        queryDivisionList.forEach(division => {
            divisionList.push(division)
        })
        employeeQuery['division'] = {
            $in: divisionList
        }
    }

    if (req.query.departments) {
        let departmentList = []
        let queryDepartmentList = req.query.departments.split(',')
        queryDepartmentList.forEach(department => {
            departmentList.push(department)
        })
        employeeQuery['department'] = {
            $in: departmentList
        }
    }
    if (req.query.contractors) {
        let contractorList = []
        let queryContractorsList = req.query.contractors.split(',')
        queryContractorsList.forEach(contractor => {
            contractorList.push(contractor)
        })
        employeeQuery['contractor'] = {
            $in: contractorList
        }
    }

    if (req.query.designations) {
        let designationList = []
        let queryDesignationList = req.query.designations.split(',')
        queryDesignationList.forEach(designation => {
            designationList.push(designation)
        })
        employeeQuery['designation'] = {
            $in: designationList
        }
    }
    if (!req.context.hasPermission(['organization.superadmin', 'organization.admin'])) {
        employeeQuery.supervisor = req.context.user.id
    }

    let employeeCount = await db.employee.find(employeeQuery).count()

    let employees = await db.employee.find(employeeQuery)
        .populate('shiftType')
        .sort({
            'name': 1
        })
        .skip(page.skip)
        .limit(page.limit)

    for (const employee of employees) {
        employee.effectiveShifts = await db.effectiveShift.find({
            employee: employee.id,
            date: {
                $gte: fromDate,
                $lt: toDate
            }
        }).sort({
            date: 1
        }).populate('shiftType')

        let previousShift = await db.effectiveShift.findOne({
            employee: employee.id,
            date: {
                $lt: fromDate
            }
        }).sort({
            date: -1
        }).populate('shiftType')

        employee.previousShift = previousShift || {
            shiftType: employee.shiftType
        }

        employee.attendances = await db.attendance.find({
            employee: employee.id,
            ofDate: {
                $gte: fromDate,
                $lt: toDate
            }
        }).sort({
            ofDate: 1
        }).populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

        employee.leaves = await db.leave.find({
            employee: employee.id,
            date: {
                $gte: fromDate,
                $lt: toDate
            },
            status: {
                $in: ['approved', 'submitted']
            }
        }).sort({
            date: 1
        }).populate('leaveType')
    }

    return {
        items: mapper.toSearchModel(employees, req.context),
        pageSize: page.limit,
        pageNo: page.pageNo,
        total: employeeCount
    }
}
