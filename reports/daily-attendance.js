const moment = require('moment')
const logger = require('@open-age/logger')('reports')
const formatter = require('../formatters/daily-attendance-report')
const db = require('../models')

module.exports = async (params, context) => {
    const log = logger.start('daily-extra-hours-after-shift-end')
    let query = {
        organization: context.organization,
        status: 'active'
    }

    let ofDate = params.from ? moment(params.from).toDate() : moment().toDate()

    let fromDate = ofDate ? moment(ofDate).startOf('day').toDate() : moment().startOf('day').toDate()

    let getExtraHours = {
        byShiftEnd: false,
        byShiftLength: false
    }

    let toDate = ofDate ? moment(ofDate).endOf('day').toDate() : moment().endOf('day').toDate()

    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`

    let organizationName = context.organization.name

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

    if (params.tagIds && params.tagIds.length) {
        let tagIds = []
        let queryTags = params.tagIds.split(',')
        Promise.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query['emp.tags'] = {
            $in: tagIds
        }
    }

    if (params.supervisor) {
        query.supervisor = global.toObjectId(params.supervisor)
    }

    if (params.shiftTypeId) {
        query.shiftType = global.toObjectId(params.shiftTypeId)
    }
    log.info(`getting employees list for report`)

    let employees = await db.employee.find(query).sort({
        name: 1
    })

    log.info(`${employees.length} employees found`)

    await Promise.mapSeries(employees, async (emp) => {
        return await db.attendance.findOne({
            employee: emp,
            ofDate: {
                $gte: fromDate,
                $lt: toDate
            }
        }).populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })
            .then(attendance => {
                emp.attendance = attendance
                return emp
            })
    })

    employees = await employees.filter((employee) => {
        return employee.attendance
    })
    log.info(`${employees.length} employees have attendance`)

    const result = await formatter.build(fileName, ofDate, getExtraHours, employees, organizationName)

    return Promise.resolve({
        fileName: fileName
    })
}
