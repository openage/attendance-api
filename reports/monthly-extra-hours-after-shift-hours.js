'use strict'
const moment = require('moment')
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

    let ofDate = params.from

    let getExtraHours = {
        byShiftEnd: false,
        byShiftLength: true
    }

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

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
