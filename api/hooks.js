'use strict'
const employees = require('../services/employees')
const ed = require('../providers/ems/index')

exports.create = async (req) => { // use by ems
    let employee = req.body._id ? ed.reform(req.body, req.context) : ed.reformV4(req.body, req.context)
    await employees.updateCreateEmployee(employee, req.context)
    return 'employee created'
}

exports.update = async (req) => {
    let employee = req.body._id ? ed.reform(req.body, req.context) : ed.reformV4(req.body, req.context)
    await employees.updateCreateEmployee(employee, req.context)
    return 'employee update'
}
