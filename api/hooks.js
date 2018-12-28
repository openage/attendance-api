'use strict'
const employees = require('../services/employees')
const ed = require('../providers/ems')

exports.create = async (req) => { // use by ems
    let employee = ed.reform(req.body, req.context)
    await employees.updateCreateEmployee(employee, req.context)
    return 'employee created'
}

exports.update = async (req) => {
    let employee = ed.reform(req.body, req.context)
    await employees.updateCreateEmployee(employee, req.context)
    return 'employee update'
}
