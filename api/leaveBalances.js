'use strict'
const mapper = require('../mappers/leaveBalance')
const pager = require('../helpers/paging')
const leaveBalanceService = require('../services/leave-balances')
const db = require('../models')

exports.grant = async (req) => {
    if (req.params.id !== 'all') {
        let balance = await leaveBalanceService.grant(req.params.id, req.body.days, req.body.journal, req.context)
        return mapper.toModel(balance, req.context)
    } else {
        let count = await leaveBalanceService.bulk(req.body.employees, req.body.leaveType, req.body.days, req.body.journal, req.context)
        return `Granted '${req.body.days}' day(s) to ${count} employees`
    }
}

exports.runOvertimeRule = async (req) => {
    let attendance = await db.attendance.findById(req.body.attendance.id)
    await leaveBalanceService.runOvertimeRules(attendance, {}, req.context)
    return 'Done'
}

exports.search = async (req) => {
    let employeeId = req.query.id || req.query.employeeId

    if (employeeId) {
        if (employeeId === 'my') {
            employeeId = req.context.employee.id
        }

        let leaveBalances = await leaveBalanceService.getByEmployee({
            id: employeeId
        }, {}, req.context)

        return mapper.toSearchModel(leaveBalances, req.context)
    }

    let pageInput = pager.extract(req)
    let result = await leaveBalanceService.search(req.query, pageInput, req.context)

    let page = {
        items: result.items.map(e => {
            return {
                id: e.id,
                name: e.name,
                code: e.code,
                designation: e.designation,
                department: e.department,
                division: e.division,
                picData: e.picData,
                picUrl: e.picUrl === '' ? null : e.picUrl,
                leaveBalances: mapper.toSearchModel(e.leaveBalances, req.context)
            }
        })
    }

    if (pageInput) {
        page.total = result.count
        page.pageNo = result.pageNo
        page.pageSize = result.limit
    }

    return page
}

exports.organizationLeaveBalances = async (req) => {
    return exports.search(req)
}
