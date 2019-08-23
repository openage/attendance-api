'use strict'
const mapper = require('../mappers/employee')
const employeeService = require('../services/employees')

const employeeGetter = require('../services/employee-getter')

exports.get = async (req) => {
    let employee = await employeeGetter.get(req.params.id, req.context)
    return mapper.toModel(employee, req.context)
}

exports.get = async (req, res) => {
    let employeeId = req.params.id === 'my' ? req.context.employee.id : req.params.id
    let employee

    if (!employeeId.isObjectId()) {
        let empQuery = {
            code: employeeId,
            organization: req.context.organization
        }
        employee = await db.employee.findOne(empQuery).populate('shiftType organization')
    } else {
        employee = await db.employee.findById(employeeId).populate('shiftType organization')
    }

    if (!employee) {
        throw new Error('profile not found')
    }

    if (employee.picUrl && !employee.picData) {
        employee.picData = await employeeService.getPicDataFromUrl(employee.picUrl)
        await employee.save()
    }

    employee.attendance = await attendanceService.getAttendanceByDate(req.query.date || new Date(), employee, { create: true }, req.context)
    if (req.params.id === 'my') {
        employee.leaveBalances = await db.leaveBalance.find({
            employee: employee.id
        }).populate('leaveType').select('units leaveType')
    }

    employee.presentDays = await db.attendance.find({
        employee: employee.id,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'present'
    }).count()

    let absents = await db.attendance.find({
        employee: employee.id,
        ofDate: {
            $gte: req.query.date ? moment(req.query.date).startOf('month').toISOString() : moment().startOf('month').toISOString(),
            $lt: req.query.date ? moment(req.query.date).endOf('month').toISOString() : moment().endOf('month').toISOString()
        },
        status: 'absent'
    }).select('ofDate').sort({ 'ofDate': 1 }).lean()

    employee.absentDates = absents.map(item => item.ofDate)
    employee.absentDays = employee.absentDates.length

    employee.today = !req.query.date

    if (employee.picUrl && !employee.picData) {
        employee.picData = await employeeService.getPicDataFromUrl(employee.picUrl)
    }
    return mapper.toModel(employee)
}

exports.merge = async (req) => {
    let employee = await employeeService.mergeEmployee(req.params.id, req.body, req.context)

    return mapper.toModel(employee)
}

exports.search = (req, res) => {
    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)
    let totalRecordsCount = 0

    let query = {
        status: 'active',
        organization: req.context.organization.id
        // phone: { $exists: true },
        // _id: { $ne: req.employee }
    }

    if (req.query.name) {
        query.$or = [{
            name: {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }, {
            code: {
                $regex: '^' + req.query.name,
                $options: 'i'
            }
        }]
    }

    if (req.query.code) {
        query.code = req.query.code
    }

    Promise.all([
        db.employee.find(query).count(),
        db.employee.find(query).populate('shiftType supervisor').sort({ name: 1 })
            .skip(fromPage).limit(pageLmt)

    ]).then((result) => {
        Promise.each(result[1], employee => {
            return db.attendance.findOne({
                employee: employee._id,
                ofDate: {
                    $gte: fromDate,
                    $lt: toDate
                }
            }).then((attendance) => {
                employee.attendance = attendance
            })
        }).then(() => {
            return res.page(mapper.toSearchModel(result[1]), pageLmt, PageNo, result[0])
        })
    }).catch(err => {
        res.failure(err)
    })
}

exports.update = async (req) => {
    let employee = await employeeService.update(req.params.id, req.body, req.context)
    return mapper.toModel(employee, req.context)
}

// exports.getEmpByAdmin = (req, res) => {
//     let query = {
//         _id: req.params.id
//     }
//     let startOfMonth = moment().startOf('month')._d
//     let endOfMonth = moment().endOf('month')._d

//     let getProfile = db.employee.findOne(query).populate('shiftType supervisor')

//     let getMonthAvg = db.monthSummary.findOne({
//         employee: req.params.id,
//         weekStart: startOfMonth,
//         weekEnd: endOfMonth
//     })

//     // let getMonthAvg = db.attendance.aggregate([{
//     //     $match: {
//     //         employee: global.toObjectId(req.params.id)
//     //     }
//     // },
//     // {
//     //     $group: {
//     //         _id: '$employee',
//     //         avg: {
//     //             $avg: '$hoursWorked'
//     //         }
//     //     }
//     // }
//     // ]);

//     Promise.all([
//         getProfile, getMonthAvg
//     ])
//         .spread((employee, monthAvg) => {
//             if (!employee) {
//                 throw new Error('profile not found')
//             }

//             let returnData = mapper.toModel(employee, req.context)

//             if (monthAvg) {
//                 returnData.avgHours = monthAvg.attendanceCount ? monthAvg.hoursWorked / monthAvg.attendanceCount : 0
//             }

//             if (employee.picUrl && !employee.picData) {
//                 return employeeService.getPicDataFromUrl(employee.picUrl)
//                     .then((picData) => {
//                         employee.picData = picData
//                         employee.save()
//                         returnData.picData = picData
//                         return res.data(returnData)
//                     })
//                     .catch(err => {
//                         return res.data(returnData)
//                     })
//             } else {
//                 return res.data(returnData)
//             }
//         })
//         .catch(err => res.failure(err))
// }
