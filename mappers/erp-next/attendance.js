'use strict'

var dates = require('../../helpers/dates')

exports.toModel = entity => {
    return {
        employee: entity.employee.code,
        attendance_date: dates.date(entity.ofDate).toString('YYYY-MM-DD'),
        status: entity.status === 'present' ? 'Present' : 'Absent',
        docstatus: 1
    }
}

exports.toSearchModel = entities => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
