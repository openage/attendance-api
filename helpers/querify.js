'use strict'
const db = global.db

exports.employeeQuery = (req) => {
    let query = {
        'status': 'active',
        'organization': global.toObjectId(req.context.organization.id)
    }

    if (req.query.name) {
        query['name'] = {
            $regex: req.query.name,
            $options: 'i'
        }
    }

    // if (req.query.status) {
    //     if (req.query.status == 'present') {
    //         req.query.status = /present|checkedin|checked-in-again/
    //     }
    //     query.status = {
    //         $regex: req.query.status,
    //         $options: 'i'
    //     }
    // }

    if (req.query.code) {
        query['code'] = {
            $regex: req.query.code,
            $options: 'i'
        }
    }

    if (req.query.tagIds) {
        let tagIds = []
        let queryTags = req.query.tagIds.split(',')
        _.each(queryTags, (tagId) => {
            tagIds.push(global.toObjectId(tagId))
        })
        query['tags'] = {
            $in: tagIds
        }
    }

    if (req.query.shiftTypeId) {
        query['shiftType'] = global.toObjectId(req.query.shiftTypeId)
    }

    return query
}

let findOrg = data => {
    return db.organization.findOne(data)
}
exports.findOrg = findOrg

let findEmployee = data => {
    return db.employee.findOne(data)
}
exports.findEmployee = findEmployee

let findEmployees = data => {
    return db.employee.find(data)
}
exports.findEmployees = findEmployees

let findLeaveType = data => {
    return db.leaveType.findOne(data)
}
exports.findLeaveType = findLeaveType

let findLeaveTypes = data => {
    return db.leaveType.find(data)
}
exports.findLeaveTypes = findLeaveTypes

let findAlertType = data => {
    return db.alertType.findOne(data)
}
exports.findAlertType = findAlertType

let findAlerttTypes = data => {
    return db.alertType.find(data)
}
exports.findAlerttTypes = findAlerttTypes

let findShiftType = data => {
    return db.shiftType.findOne(data)
}
exports.findShiftType = findShiftType

let findShiftTypes = data => {
    return db.shiftType.find(data)
}
exports.findShiftTypes = findShiftTypes

let findShifts = data => {
    return db.shift.find(data)
}
exports.findShifts = findShifts

let getAttendance = data => {
    return db.attendance.findOne(data)
}
exports.getAttendance = getAttendance

let getHoliday = data => {
    return db.holiday.findOne(data)
}
exports.getHoliday = getHoliday

let getHolidays = data => {
    return db.holiday.find(data)
}
exports.getHolidays = getHolidays

let getTotalLeaveBalance = employee => {
    return db.leaveBalance.find({
        employee: employee
    }).populate('leaveType').select('units leaveType')
        .then(leaveBalances => {
            // employee.leaveBalances = leaveBalances;
            return leaveBalances
        })
}

exports.getTotalLeaveBalance = getTotalLeaveBalance
