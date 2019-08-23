'use strict'
const moment = require('moment')
const formatter = require('../formatters/monthly-late-check-in')
const db = require('../models')
const dates = require('../helpers/dates')

module.exports = async (params, context) => {
    const log = context.logger.start('reports')

    let organization = context.organization

    let query = {
        organization: global.toObjectId(organization.id),
        status: 'active'
    }

    let attendances = []

    let ofDate = params.from

    let getExtraHours = {
        byShiftEnd: false,
        byShiftLength: false
    }

    let fromDate = dates.date(ofDate).bom()
    let toDate = dates.date(ofDate).eom()

    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`

    var orgDetails = {
        orgName: context.organization.name,
        downloaderName: context.employee.name,
        downloaderEmail: context.employee.email,
        downloaderPhone: context.employee.phone
    }

    if (params.name) {
        query.name = {
            $regex: params.name,
            $options: 'i'
        }
    }

    if (params.code) {
        query.code = {
            $regex: params.code,
            $options: 'i'
        }
    }

    if (params.supervisor) {
        query.supervisor = global.toObjectId(params.supervisor)
    }

    if (params.shiftType) {
        query.shiftType = global.toObjectId(params.shiftType)
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

    log.debug(`got '${employees.length}' employee(s)`)

    employees = employees.sort((a, b) => {
        return a.code - b.code
    })

    for (const employee of employees) {
        employee.leaves = await db.leave.find({
            employee: global.toObjectId(employee._id),
            status: 'approved',
            date: {
                $gte: fromDate,
                $lt: moment()
            }
        }).populate('leaveType')

        employee.monthLog = await db.monthSummary.findOne({
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

        return attendances.push(employee)
    }

    const report = await formatter.build(fileName, ofDate, getExtraHours, attendances, orgDetails)

    return {
        fileName: fileName
    }
}
