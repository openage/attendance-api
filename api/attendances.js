'use strict'
const mapper = require('../mappers/attendance')
const summaryMapper = require('../mappers/summary')
const moment = require('moment')
const offline = require('@open-age/offline-processor')
const timeLogsService = require('../services/time-logs')

const db = require('../models')
const attendanceService = require('../services/attendances')
const userService = require('../services/employee-getter')
const monthlyService = require('../services/monthly-summaries')

const timeLogsApi = require('../api/timeLogs')

const dates = require('../helpers/dates')

const paging = require('../helpers/paging')

exports.getCurrentDate = (req, res) => {
    let currentDate = moment().utc().toDate()
    res.data({
        currentDate: currentDate
    })
}

exports.get = async (req) => {
    let attendance
    if (req.params.id.isObjectId()) {
        attendance = await attendanceService.get(req.params.id, req.context)
    } else {
        let date = dates.date(req.params.id).bod()

        let userId = req.query.employeeId || req.query['user-id']
        let userCode = req.query.employeeCode || req.query['user-code']

        let user
        if (userId) {
            user = {
                id: userId === 'my' ? req.context.user.id : userId
            }
        } else if (userCode) {
            if (userCode === 'my') {
                user = {
                    id: req.context.user.id
                }
            } else {
                user = await userService.get(userCode, req.context)
            }
        } else {
            user = req.context.user
        }

        attendance = await attendanceService.getAttendanceByDate(date, user, {
            create: true
        }, req.context)
    }
    attendance.passes = timeLogsService.getPasses(attendance, req.context)
    return mapper.toModel(attendance, req.context)
}

exports.search = async (req) => {
    let query = req.query

    let userId = query.employeeId || query['user-id'] || query.employee
    let userCode = query.employeeCode || query['user-code']

    if (!userId || !userCode) {
        query.user = {
            id: userId,
            code: userCode
        }
    } else {
        query.user = req.context.user
    }

    let result = await attendanceService.search(query, { sort: { ofDate: true } }, req.context)

    return mapper.toSearchModel(result.items, req.context)
}

exports.create = async (req) => {
    let status = 'absent'

    if (req.body.status === 'weekOff') {
        status = 'weekOff'
    }

    let date = dates.date(req.body.ofDate).bod()

    let attendance = await attendanceService.getAttendanceByDate(date, req.body.employee, {
        create: true
    }, req.context)

    attendance.status = status

    await attendance.save()

    let entity = await db.attendance.findById(attendance.id)
        .populate('employee timeLogs')
        .populate({
            path: 'shift',
            populate: {
                path: 'shiftType'
            }
        })

    return mapper.toModel(entity, req.context)
}

exports.update = async (req) => {
    let attendance
    if (req.body.status === 'weekOff') {
        attendance = await attendanceService.markOffDay({
            id: req.params.id
        }, req.context)
    }
    return mapper.toModel(attendance, req.context)
}

exports.summary = (req, res) => {
    let attendanceOf = req.params.id === 'my' ? req.context.user.id : req.params.id

    let toDate = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')

    let forToday = moment()
        .set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let currentYearDate = moment().startOf('year')
    // let currentWeekDate = moment().startOf('week').add(1, 'day');
    let currentWeekDate = moment().startOf('week').toDate()
    let commingSunday = moment().endOf('week').toDate()
    let currentMonthDate = moment().startOf('month').toDate()
    let endOfMonth = moment().endOf('month').toDate()

    Promise.all([
        db.yearSummary.find({ // multiple months
            employee: attendanceOf,
            endMonth: {
                $gte: currentYearDate,
                $lte: endOfMonth
            }
        }),

        db.monthSummary.find({ // multiple weeks
            employee: attendanceOf,
            weekStart: {
                $gte: currentMonthDate
            },
            weekEnd: {
                $lte: endOfMonth
            }
        })
            .populate('attendances'),

        db.weekSummary.findOne({ // current week
            employee: attendanceOf,
            weekStart: {
                $gte: currentWeekDate
            },
            weekEnd: {
                $lte: commingSunday
            }
        }).populate('attendances'),

        db.attendance.findOne({ // getting today attendance
            employee: attendanceOf,
            ofDate: {
                $gte: forToday,
                $lt: toDate
            }
        })
            .populate('recentMostTimeLog')
    ])
        .then(function (results) {
            // months , weeks , week ,day
            return res.data(summaryMapper.toModel(results[0], results[1], results[2], results[3], req.context))
        }).catch(err => res.failure(err))
}
exports.getMonthlySummary = async (req) => {
    let pageInput = paging.extract(req)

    if (!req.query.supervisorId && req.query.supervisorCode) {
        let employee = await userService.get(req.query.supervisorCode, req.context)
        req.query.supervisorId = employee.id
    }

    let params = {
        dates: {
            from: req.query.ofDate || new Date()
        },
        employee: {
            name: req.query.name,
            code: req.query.code,
            supervisor: req.query.supervisorId
        }
    }

    if (req.query.departments) {
        params.employee.departments = req.query.departments.split(',')
    }

    if (req.query.designations) {
        params.employee.designations = req.query.designations.split(',')
    }
    if (req.query.userTypes) {
        params.employee.userTypes = req.query.userTypes.split(',')
    }
    if (req.query.divisions) {
        params.employee.divisions = req.query.divisions.split(',')
    }

    if (req.query.contractors) {
        params.employee.contractors = req.query.contractors.split(',')
    }

    pageInput = pageInput || {}

    pageInput.columns = [
        'employee',
        'employeeModel',
        'leavesSummary',
        'attendanceSummary',
        'shiftSummary'
    ]

    let page = await monthlyService.search(params, pageInput, req.context)

    return {
        items: page.items.map(item => summaryMapper.monthlySummary(item)),
        total: page.total,
        pageNo: page.pageNo,
        pageSize: page.pageSize
    }
}

exports.regenerate = async (req) => {
    if (req.body.id) {
        let attendance = await attendanceService.reset({
            id: req.body.id
        }, {
            removeWeekOff: req.body.removeWeekOff,
            adjustTimeLogs: req.body.adjustTimeLogs,
            recalculateShift: req.body.recalculateShift
        }, req.context)

        return mapper.toModel(attendance, req.context)
    }

    let date = dates.date(req.query.date || req.body.date).bod()
    let period = req.query.period || req.body.period || 'day'

    let entity = {
        date: date
    }

    if (req.body.employee && req.context.user.id) {
        entity.employee = {
            id: req.body.employee.id
        }
    }

    await offline.queue(period === 'month' ? 'work-month' : 'work-day', 'regenerate', entity, req.context)

    return {
        message: 'submitted'
    }
}

const extractQuery = async (params, context) => {
    let ofDate = params.ofDate
    let fromDate = dates.date(ofDate).bod()
    let toDate = dates.date(ofDate).eod()
    let query = {
        'emp.status': 'active',
        'emp.organization': global.toObjectId(context.organization.id),
        'ofDate': {
            $gte: fromDate,
            $lt: toDate
        }
    }

    if (params.name) {
        query['emp.name'] = {
            $regex: params.name,
            $options: 'i'
        }
    }

    if (params.code) {
        query['emp.code'] = params.code
    } else {
        query['emp.code'] = { $ne: 'default' }
    }

    if (params.supervisorId) {
        query['emp.supervisor'] = global.toObjectId(params.supervisorId)
    }

    if (params.supervisorCode) {
        let supervisor = await userService.get(params.supervisorCode, context)
        query['emp.supervisor'] = global.toObjectId(supervisor.id)
    }

    if (params.userTypes) {
        let userTypesList = []
        let queryUserTypesList = params.userTypes.split(',')
        queryUserTypesList.forEach(userType => {
            userTypesList.push(userType)
        })
        query['emp.userType'] = {
            $in: userTypesList
        }
    }

    if (params.shiftTypeId) {
        let shiftIds = []
        let queryShifts = params.shiftTypeId.split(',')
        queryShifts.forEach(shift => {
            shiftIds.push(global.toObjectId(shift))
        })
        query['emp.shiftType'] = {
            $in: shiftIds
        }
    }

    if (params.departments) {
        let departmentList = []
        let queryDepartmentList = params.departments.split(',')
        queryDepartmentList.forEach(department => {
            departmentList.push(department)
        })
        query['emp.department'] = {
            $in: departmentList
        }
    }

    if (params.contractors) {
        let contractorList = []
        let queryContractorsList = params.contractors.split(',')
        queryContractorsList.forEach(contract => {
            contractorList.push(contract.toLowerCase())
        })
        query['emp.contractor'] = {
            $in: contractorList
        }
    }

    if (params.divisions) {
        let divisionList = []
        let queryDivisionList = params.divisions.split(',')
        queryDivisionList.forEach(division => {
            divisionList.push(division)
        })
        query['emp.division'] = {
            $in: divisionList
        }
    }

    if (params.designations) {
        let designationList = []
        let queryDesignationList = params.designations.split(',')
        queryDesignationList.forEach(designation => {
            designationList.push(designation)
        })
        query['emp.designation'] = {
            $in: designationList
        }
    }

    if (params.status) {
        let statusList = []
        let queryStatusList = params.status.split(',')
        queryStatusList.forEach(status => {
            if (status === 'halfDay') {
                status = 'present'
                query.$or = [{
                    firstHalfStatus: 'A'
                }, {
                    secondHalfStatus: 'A'
                }]
            }
            if ((statusList.length = 1 && statusList[0] === 'present') && status === 'present') {
                return 0
            } else {
                statusList.push(status)
            }
        })
        query['status'] = {
            $in: statusList
        }
    }

    if (params.hours) {
        let hoursList = []
        let queryhoursList = params.hours.split(',')
        queryhoursList.forEach(hours => {
            hoursList.push(hours.toLowerCase())
        })
        query['hours'] = {
            $in: hoursList
        }
    }
    if (params.clockedGt) {
        let minutes = (params.clockedGt) * 60
        query['minutes'] = {
            $gte: minutes
        }
    }

    if (params.clockedLt) {
        let minutes = (params.clockedLt) * 60
        query['minutes'] = {
            $lte: minutes
        }
    }

    if (params.checkInStatus) {
        let checkInStatusList = []
        let queryCheckInStatusList = params.checkInStatus.split(',')
        queryCheckInStatusList.forEach(checkInStatus => {
            checkInStatusList.push(checkInStatus.toLowerCase())
        })
        query['checkInStatus'] = {
            $in: checkInStatusList
        }
        query['status'] = 'present'
    }

    if (params.checkInAfter) {
        let t = params.checkInAfter.split(':')
        let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
        query['checkIn'] = {
            $gte: time
        }
    }

    if (params.checkInBefore) {
        let t = params.checkInBefore.split(':')
        let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
        query['checkIn'] = {
            $lte: time
        }
    }

    if (params.checkOutStatus) {
        let checkOutStatusList = []
        let queryCheckOutStatusList = params.checkOutStatus.split(',')
        queryCheckOutStatusList.forEach(checkOutStatus => {
            checkOutStatusList.push(checkOutStatus.toLowerCase())
        })
        query['checkOutStatus'] = {
            $in: checkOutStatusList
        }
        query['status'] = 'present'
    }

    if (params.checkOutAfter) {
        let t = params.checkOutAfter.split(':')
        let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
        query['checkOut'] = {
            $gte: time
        }
    }

    if (params.checkOutBefore) {
        let t = params.checkOutBefore.split(':')
        let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
        query['checkOut'] = {
            $lte: time
        }
    }

    return query
}

exports.continueShift = async (req) => {
    let currentAttendance = await attendanceService.get(req.params.id, req.context)
    const employee = currentAttendance.employee
    let nextDate = dates.date(currentAttendance.ofDate).nextBod()
    let nextAttendance = await attendanceService.getAttendanceByDate(nextDate, employee, {
        create: true
    }, req.context)

    if (req.body.isContinue) {
        return continueA(currentAttendance, nextAttendance, req.context)
    } else {
        return discontinueA(currentAttendance, nextAttendance, req.context)
    }
}

const discontinueA = async (currentAttendance, nextAttendance, context) => {
    var i
    var timeLog
    for (i = 0; i < currentAttendance.timeLogs.length; i++) {
        timeLog = currentAttendance.timeLogs[i]
        if (timeLog.source === timeLogsService.sourceTypes.system && timeLog.type === timeLogsService.timeLogTypes.checkOut) {
            await timeLogsService.remove(timeLog, context)
            currentAttendance.timeLogs.splice(i, 1)
        }
    }

    currentAttendance.isContinue = false
    currentAttendance.checkOutExtend = null
    await currentAttendance.save()

    for (i = 0; i < nextAttendance.timeLogs.length; i++) {
        timeLog = nextAttendance.timeLogs[i]
        if (timeLog.source === timeLogsService.sourceTypes.system && timeLog.type === timeLogsService.timeLogTypes.checkIn) {
            await timeLogsService.remove(timeLog, context)
            nextAttendance.timeLogs.splice(i, 1)
        }
    }

    await nextAttendance.save()

    await attendanceService.reset(currentAttendance, {}, context)
    await attendanceService.reset(nextAttendance, {}, context)

    return currentAttendance
}

const continueA = async (currentAttendance, nextAttendance, context) => {
    const employee = currentAttendance.employee
    let nextShiftStartTime = dates.date(nextAttendance.ofDate).setTime(nextAttendance.shift.shiftType.startTime)

    let checkInTimeLog = await timeLogsService.create({
        time: nextShiftStartTime,
        type: timeLogsService.timeLogTypes.checkIn,
        employee: employee,
        ipAddress: context.ipAddress,
        source: timeLogsService.sourceTypes.system
    }, context)

    await attendanceService.addTimeLog(checkInTimeLog, nextAttendance, context)
    // nextAttendance.timeLogs.push(checkInTimeLog)
    // await nextAttendance.save()

    let checkOutTimeLog = await timeLogsService.create({
        time: dates.time(nextShiftStartTime).subtract(1),
        type: timeLogsService.timeLogTypes.checkOut,
        employee: employee,
        ipAddress: context.ipAddress,
        source: timeLogsService.sourceTypes.system
    }, context)

    currentAttendance.isContinue = true
    currentAttendance.checkOutExtend = checkInTimeLog.time

    await currentAttendance.save()

    await attendanceService.addTimeLog(checkOutTimeLog, currentAttendance, context)
    // currentAttendance.timeLogs.push(checkOutTimeLog)
    return currentAttendance
}

exports.getOneDayAttendances = async (req) => {
    let page = paging.extract(req)
    let query = await extractQuery(req.query, req.context)

    let entities = await attendanceService.getOneDayAttendances(page, query, req.context)

    entities.forEach(item => {
        item.passes = timeLogsService.getPasses(item, req.context)
    })

    let result = {
        items: mapper.toSearchModel(entities, req.context)
    }

    let total = 0

    if (page) {
        total = await db.attendance.aggregate([{
            $lookup: {
                from: 'shifts',
                localField: 'shift',
                foreignField: '_id',
                as: 'currentShift'
            }
        }, {
            $unwind: '$currentShift'
        }, {
            $lookup: {
                from: 'shifttypes',
                localField: 'currentShift.shiftType',
                foreignField: '_id',
                as: 'shiftType'
            }
        }, {
            $unwind: '$shiftType'
        }, {
            $lookup: {
                from: 'employees',
                localField: 'employee',
                foreignField: '_id',
                as: 'emp'
            }
        }, {
            $unwind: '$emp'
        }, {
            $match: query
        }, {
            $count: 'data'
        }])
    }

    if (page) {
        result.pageSize = page.limit
        result.pageNo = page.pageNo
        result.total = total && total.length ? total[0].data : 0
    }

    return result
}

exports.extendShift = (req, res) => {
    let updateQuery = {}

    if (!req.params.id) {
        return res.failure('id is required')
    }

    if (!req.body.checkOutExtend) {
        updateQuery = {
            $unset: {
                checkOutExtend: 1
            }
        }
    } else {
        updateQuery = {
            $set: {
                checkOutExtend: moment(req.body.checkOutExtend)._d
            }
        }
    }

    return db.attendance.findByIdAndUpdate({
        _id: req.params.id
    }, updateQuery, {
        new: true
    })
        .then((attendance) => {
            if (!attendance) {
                return res.failure('no attendance found')
            }
            return res.data(mapper.toModel(attendance, req.context))
        })
        .catch(err => {
            return res.failure(err)
        })
}

exports.clearAction = async (req) => {
    let log = req.context.logger.start('api/attendances:clearAction')
    let attendance = await attendanceService.clearNeedAction(req.params.id, req.context)
    log.end()
    return mapper.toModel(attendance, req.context)
}
exports.bulk = async (req) => {
    return timeLogsApi.bulk(req)
}
exports.extractQuery = extractQuery
