'use strict'
const moment = require('moment')
const _ = require('underscore')
const logger = require('@open-age/logger')('reports')
const formatter = require('../formatters/monthly-attendance-report')
const db = require('../models')

module.exports = async (params, context) => {
    let organization = context.organization

    let query = {
        organization: global.toObjectId(organization.id),
        status: 'active'
    }

    let attendances = []

    let ofDate = params.dates && params.dates.from ? params.dates.from : new Date()

    let getExtraHours = {
        byShiftEnd: false,
        byShiftLength: false
    }
    let tagIds = []
    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`

    var orgDetails = {
        orgName: context.organization.name,
        downloaderName: context.employee.name,
        downloaderEmail: context.employee.email,
        downloaderPhone: context.employee.phone
    }
    if (params.employee) {
        if (params.employee.name) {
            query.name = {
                $regex: params.employee.name,
                $options: 'i'
            }
        }

        if (params.employee.code) {
            query.code = {
                $regex: params.employee.code,
                $options: 'i'
            }
        }

        if (params.employee.supervisor) {
            query.supervisor = global.toObjectId(params.employee.supervisor.id)
        }
        if (params.employee.userTypes) {
            _.each(params.employee.userTypes, (userType) => {
                tagIds.push(global.toObjectId(userType.id))
            })
        }

        if (params.employee.contractors) {
            let queryContractorsList = params.employee.contractors
            _.each(queryContractorsList, (contractor) => {
                tagIds.push(global.toObjectId(contractor.id))
            })
        }
        if (tagIds.length) {
            query['tags'] = {
                $in: tagIds
            }
        }

        if (params.employee.divisions) {
            let divisionList = []
            let queryDivisionList = params.employee.divisions
            _.each(queryDivisionList, (division) => {
                divisionList.push(division.name.toLowerCase())
            })
            query['division'] = {
                $in: divisionList
            }
        }

        if (params.employee.departments) {
            let departmentList = []
            let queryDepartmentList = params.employee.departments
            _.each(queryDepartmentList, (department) => {
                departmentList.push(department.name.toLowerCase())
            })
            query['department'] = {
                $in: departmentList
            }
        }
        if (params.employee.designations) {
            let designationList = []
            let queryDesignationList = params.employee.designations
            _.each(queryDesignationList, (designation) => {
                designationList.push(designation.name.toLowerCase())
            })
            query['designation'] = {
                $in: designationList
            }
        }

        if (params.employee.contractors) {
            let contractorList = []
            let queryContractorsList = params.employee.contractors
            _.each(queryContractorsList, (contractor) => {
                contractorList.push(contractor.name.toLowerCase())
            })
            query['contractor'] = {
                $in: contractorList
            }
        }
    }
    if (params.shiftType) {
        query.shiftType = global.toObjectId(params.shiftType.id)
    }

    let employees = await db.employee.aggregate([{
        $match: query
    }, {
        $project: {
            name: 1,
            code: 1,
            designation: 1
        }
    }])

    employees = employees.sort((a, b) => {
        return a.code - b.code
    })
    await Promise.each(employees, async (employee) => {
        await Promise.all([
            db.leave.find({
                employee: global.toObjectId(employee._id),
                status: 'approved',
                date: {
                    $gte: fromDate,
                    $lt: moment()
                }
            }).populate('leaveType'),
            db.monthSummary.findOne({
                employee: employee,
                weekStart: fromDate,
                weekEnd: toDate
            }).populate({
                path: 'attendances',
                populate: {
                    path: 'shift',
                    populate: {
                        path: 'shiftType'
                    }
                }
            })
        ])
            .spread((leaves, monthLog) => {
                return attendances.push({
                    employee: employee,
                    leaves: leaves,
                    monthLog: monthLog
                })
            })
    })

    const report = await formatter.build(fileName, ofDate, getExtraHours, attendances, orgDetails)

    return Promise.resolve({
        fileName: fileName
    })
}
