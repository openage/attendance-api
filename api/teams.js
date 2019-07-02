'use strict'
const mapper = require('../mappers/employee')
const db = require('../models')

const paging = require('../helpers/paging')
const dates = require('../helpers/dates')

exports.getMyTeam = async (req) => {
    let date = dates.date(req.query.date)

    let fromDate = date.bod()

    let toDate = date.eod()

    let pageInput = paging.extract(req)

    let supervisor
    if (req.params.id === 'my') {
        supervisor = req.context.employee.id
    } else {
        supervisor = req.params.id
    }

    let where = {
        $or: [{
            supervisor: supervisor,
            status: 'active'
        }, {
            supervisor: supervisor,
            status: 'inactive',
            deactivationDate: {
                $gte: new Date()
            }
        }]
    }

    let total = await db.employee.find(where).count()

    let employees

    if (pageInput) {
        employees = await db.employee.find(where).skip(pageInput.skip).limit(pageInput.limit).populate('shiftType supervisor')
    } else {
        employees = await db.employee.find(where).populate('shiftType supervisor')
    }

    for (const employee of employees) {
        employee.today = !req.query.date
        employee.attendance = await db.attendance.findOne({
            employee: employee.id.toString(),
            ofDate: {
                $gte: fromDate,
                $lt: toDate
            }
        }).populate('recentMostTimeLog timeLogs').populate({ path: 'shift', populate: { path: 'shiftType' } })
    }

    let page = {
        items: mapper.toSearchModel(employees)
    }

    if (pageInput) {
        page.total = total
        page.pageNo = pageInput.pageNo
        page.pageSize = pageInput.limit
    }

    return page
}
