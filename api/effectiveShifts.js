'use strict'
const logger = require('@open-age/logger')('api/effectiveShifts')
const mapper = require('../mappers/effectiveShift')
const moment = require('moment')
const async = require('async')
const _ = require('underscore')
const excelBuilder = require('msexcel-builder')
const appRootPath = require('app-root-path')
const formidable = require('formidable')
const join = require('path').join
const fs = require('fs')
const effectiveShifts = require('../services/effectiveShifts')
const attendanceService = require('../services/attendances')

const shiftRosterExcel = require('../extractors/shiftRosterExcel')
const db = require('../models')
const offline = require('@open-age/offline-processor')

const dates = require('../helpers/dates')
const paging = require('../helpers/paging')

exports.update = async (req) => {
    let date = dates.date(req.body.date).bod()
    let employee = {
        id: req.params.id
    }

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
            employee: req.params.id,
            organization: req.context.organization.id,
            supervisor: req.employee.id
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
    return mapper.toModel(effectiveShift)
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
    let tagIds = []

    let page = paging.extract(req)

    let fromDate = dates.date(req.query.fromDate).bod()

    let toDate = dates.date(fromDate).nextWeek()

    let employeeQuery = {
        organization: global.toObjectId(req.context.organization.id),
        status: 'active'
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
        _.each(queryUserTypesList, (userType) => {
            userTypesList.push(userType)
        })
        employeeQuery['userType'] = {
            $in: userTypesList
        }
    }

    if (req.query.supervisorId) {
        employeeQuery['supervisor'] = global.toObjectId(req.query.supervisorId)
    }

    if (req.query.shiftType) {
        let shiftIds = []
        let queryShifts = req.query.shiftType.split(',')
        _.each(queryShifts, (shift) => {
            shiftIds.push(global.toObjectId(shift))
        })
        employeeQuery['shiftType'] = {
            $in: shiftIds
        }
    }

    if (req.query.divisions) {
        let divisionList = []
        let queryDivisionList = req.query.divisions.split(',')
        _.each(queryDivisionList, (division) => {
            divisionList.push(division.toLowerCase())
        })
        employeeQuery['division'] = {
            $in: divisionList
        }
    }

    if (req.query.departments) {
        let departmentList = []
        let queryDepartmentList = req.query.departments.split(',')
        _.each(queryDepartmentList, (department) => {
            departmentList.push(department.toLowerCase())
        })
        employeeQuery['department'] = {
            $in: departmentList
        }
    }
    if (req.query.contractors) {
        let contractorList = []
        let queryContractorsList = req.query.contractors.split(',')
        _.each(queryContractorsList, (contractor) => {
            contractorList.push(contractor.toLowerCase())
        })
        employeeQuery['contractor'] = {
            $in: contractorList
        }
    }

    if (req.query.designations) {
        let designationList = []
        let queryDesignationList = req.query.designations.split(',')
        _.each(queryDesignationList, (designation) => {
            designationList.push(designation.toLowerCase())
        })
        employeeQuery['designation'] = {
            $in: designationList
        }
    }
    if (!req.context.hasPermission('superadmin')) {
        employeeQuery.supervisor = req.employee.id
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
        items: mapper.toSearchModel(employees),
        pageSize: page.limit,
        pageNo: page.pageNo,
        total: employeeCount
    }
}

exports.getRosterShiftExcel = (req, res) => {
    let date = req.query.ofDate
    let query = {
        supervisor: req.employee.id,
        organization: req.context.organization.id,
        status: 'active'
    }
    let organization = req.context.organization

    let supervisor = req.employee

    let fileName = 'Roster Shift Excel' + moment().startOf('month').format('MMMM Do') + '.xlsx'

    db.employee.find(query)
        .then((team) => {
            return rosterXlFormat(fileName, organization, team, supervisor, date)
        })
        .then((result) => {
            if (result.isCreated) {
                return res.download(join(appRootPath.path, `temp/${fileName}`), fileName, function (err) {
                    if (err) {
                        throw err
                    }
                    fs.unlink(join(appRootPath.path, `temp/${fileName}`), function (err) {
                        if (err) {
                            throw err
                        }
                    })
                })
            }
            throw result
        })
        .catch((err) => {
            res.failure(err)
        })
}

var rosterXlFormat = (fileName, organization, employees, supervisor, date) => {
    var workbook = excelBuilder.createWorkbook('./temp/', fileName)
    let totalEmployees = employees.length
    let totalRows = totalEmployees * 10
    var sheet1 = workbook.createSheet('sheet1', totalEmployees * 10, (totalEmployees * totalRows))

    sheet1.font(1, 1, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(1, 1, `Organization`)

    sheet1.font(2, 1, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(2, 1, `${organization.name}`)

    sheet1.font(1, 2, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(1, 2, `Supervisor`)

    sheet1.font(2, 2, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(2, 2, `${supervisor.name}`)

    sheet1.font(1, 3, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(1, 3, `Total Employees`)

    sheet1.font(2, 3, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(2, 3, `${totalEmployees}`)

    sheet1.font(1, 4, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(1, 4, `Month`)

    sheet1.font(2, 4, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(2, 4, `${moment().format('MMMM')}`) // todo

    sheet1.font(1, 5, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(1, 5, `Year`)

    sheet1.font(2, 5, {
        bold: 'true',
        sz: '10'
    })
    sheet1.set(2, 5, `${moment().format('YYYY')}`) // todo

    sheet1.font(4, 6, {
        bold: 'true',
        sz: '14'
    })
    sheet1.set(4, 6, `Weekly Roster Sheet`)

    sheet1.font(1, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(1, 7, `EmpCode`)

    sheet1.font(2, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(2, 7, `EmpName`)

    sheet1.font(3, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(3, 7, `${moment(date).format('DD/MM/YYYY')}`)

    sheet1.font(4, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(4, 7, `${moment(date).add(1, 'days').format('DD/MM/YYYY')}`)

    sheet1.font(5, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(5, 7, `${moment(date).add(2, 'days').format('DD/MM/YYYY')}`)

    sheet1.font(6, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(6, 7, `${moment(date).add(3, 'days').format('DD/MM/YYYY')}`)

    sheet1.font(7, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(7, 7, `${moment(date).add(4, 'days').format('DD/MM/YYYY')}`)

    sheet1.font(8, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(8, 7, `${moment(date).add(5, 'days').format('DD/MM/YYYY')}`)

    sheet1.font(9, 7, {
        bold: 'true',
        sz: '11'
    })
    sheet1.set(9, 7, `${moment(date).add(6, 'days').format('DD/MM/YYYY')}`)

    let count = 8

    _.each(employees, (employee) => {
        sheet1.font(1, count, {
            bold: 'true',
            sz: '8'
        })
        sheet1.set(1, count, `${employee.code}`)

        sheet1.font(2, count, {
            bold: 'true',
            sz: '8'
        })
        sheet1.set(2, count, `${employee.name}`)

        count++
    })

    return new Promise((resolve, reject) => {
        workbook.save(function (err) {
            if (!err) {
                console.log('congratulations, your workbook created')
                return resolve({
                    isCreated: true,
                    message: 'RosterExcel sheet successfully created'
                })
            }
            workbook.cancel()
            return reject(new Error('RosterExcel sheet not created'))
        })
    })
}
