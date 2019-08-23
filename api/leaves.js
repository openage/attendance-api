'use strict'
const mapper = require('../mappers/leave')

const leaves = require('../services/leaves')
const employeeService = require('../services/employees')
const pager = require('../helpers/paging')

exports.create = async (req) => {
    let leave = await leaves.create(req.body, req.context)
    return mapper.toModel(leave, req.context)
}

exports.bulk = async (req) => {
    for (const item of req.body.items) {
        if (item.employee.code) {
            let employee = await employeeService.getByCode(item.employee.code, req.context)
            if (employee) {
                item.employee = employee
            } else {
                return (`Employee with code ${item.employee.code} not exists`)
            }
        }

        await leaves.create(item, req.context)
    }

    return `added '${req.body.items.length}' leaves`
}

exports.get = async (req) => {
    let leave = await leaves.get(req.params.id, req.context)
    leave.days = leave.units / leave.leaveType.unitsPerDay
    return mapper.toModel(leave, req.context)
}

exports.search = async (req) => {
    let pageInput = pager.extract(req)

    let result = await leaves.search(req.query, pageInput, req.context)

    let page = {
        items: mapper.toSearchModel(result.items, req.context),
        total: result.count
    }

    if (pageInput) {
        page.pageNo = pageInput.pageNo
        page.pageSize = pageInput.limit
    }

    return page
}

exports.delete = async (req) => {
    await leaves.remove(req.params.id, req.context)
    return 'leave deleted successfully'
}

exports.actionOnLeave = async (req) => {
    let leave = await leaves.update(req.params.id, req.body, req.context)
    return mapper.toModel(leave, req.context)
}

exports.myTeamLeaves = async (req) => {
    req.query.supervisorId = req.context.user.id
    return exports.search(req)
}

exports.organizationLeaves = async (req) => {
    return exports.search(req)
}
