'use strict'
const moment = require('moment')
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
    let fromDate = ofDate ? moment(ofDate).startOf('month') : moment().startOf('month')

    let toDate = ofDate ? moment(ofDate).endOf('month') : moment().endOf('month')

    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`

    var orgDetails = {
        orgName: context.organization.name,
        downloaderName: context.user.name,
        downloaderEmail: context.user.email,
        downloaderPhone: context.user.phone
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

        if (params.employee.divisions) {
            query['division'] = {
                $in: params.employee.divisions.map(i => i.name)
            }
        }

        if (params.employee.departments) {
            query['department'] = {
                $in: params.employee.departments.map(i => i.name)
            }
        }
        if (params.employee.designations) {
            query['designation'] = {
                $in: params.employee.designations.map(i => i.name)
            }
        }

        if (params.employee.contractors) {
            query['contractor'] = {
                $in: params.employee.contractors.map(i => i.name)
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
    }, {
        $sort: { code: 1 }
    },
    {
        $collation: { locale: 'en_US', numericOrdering: true }
    }])

    // employees = employees.sort((a, b) => {
    //     return Number(a.code) - Number(b.code)
    // })
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

    return Promise.resolve({
        fileName: fileName
    })
}
