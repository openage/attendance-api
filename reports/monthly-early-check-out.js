'use strict'
const moment = require('moment')
const logger = require('@open-age/logger')('reports')
const formatter = require('../formatters/monthly-early-check-out')
const db = require('../models')

module.exports = async (params, context) => {
    const log = logger.start('reports')

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

    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`

    var orgDetails = {
        orgName: context.organization.name,
        downloaderName: context.user.name,
        downloaderEmail: context.user.email,
        downloaderPhone: context.user.phone
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
                employee.leaves = leaves
                employee.monthLog = monthLog
                return attendances.push(employee)
            })
    })

    const report = await formatter.build(fileName, ofDate, getExtraHours, attendances, orgDetails)

    return Promise.resolve({
        fileName: fileName
    })
}
