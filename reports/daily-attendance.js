'use strict'

const dates = require('../helpers/dates')
const _ = require('underscore')
const attendanceService = require('../services/attendances')
const shiftTypeService = require('../services/shift-types')

const moment = require('moment')
const timeLogType = {
    checkIn: 'checkIn',
    checkOut: 'checkOut'
}

const extractQuery = (params, context) => {
    let tagIds = []
    let ofDate = new Date()
    if (params.dates && params.dates.from) {
        ofDate = params.dates.from
    }
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
    if (params.employee) {
        if (params.employee.name) {
            query['emp.name'] = {
                $regex: params.employee.name,
                $options: 'i'
            }
        }

        if (params.employee.code) {
            query['emp.code'] = {
                $regex: params.employee.code,
                $options: 'i'
            }
        }

        if (params.employee.supervisor) {
            query['emp.supervisor'] = global.toObjectId(params.employee.supervisor.id)
        }

        if (params.employee.userTypes) {
            let userTypesList = []
            let queryUserTypesList = params.employee.userTypes
            _.each(queryUserTypesList, (userType) => {
                userTypesList.push(userType.code)
            })
            query['emp.userType'] = {
                $in: userTypesList
            }
        }

        if (params.employee.departments) {
            let departmentList = []
            let queryDepartmentList = params.employee.departments
            _.each(queryDepartmentList, (department) => {
                departmentList.push(department.name)
            })
            query['emp.department'] = {
                $in: departmentList
            }
        }
        if (params.employee.divisions) {
            let divisionList = []
            let queryDivisionList = params.employee.divisions
            _.each(queryDivisionList, (division) => {
                divisionList.push(division.name)
            })
            query['emp.division'] = {
                $in: divisionList
            }
        }

        if (params.employee.designations) {
            let designationList = []
            let queryDesignationList = params.employee.designations
            _.each(queryDesignationList, (designation) => {
                designationList.push(designation.name)
            })
            query['emp.designation'] = {
                $in: designationList
            }
        }

        if (params.employee.contractors) {
            let contractorList = []
            let queryContractorsList = params.employee.contractors
            _.each(queryContractorsList, (contractor) => {
                contractorList.push(contractor.name)
            })
            query['emp.contractor'] = {
                $in: contractorList
            }
        }
    }
    if (params.shiftType) {
        let shiftIds = []
        let queryShifts = params.shiftType
        queryShifts.forEach(shift => {
            shiftIds.push(global.toObjectId(shift.id))
        })
        query['emp.shiftType'] = {
            $in: shiftIds
        }
    }
    if (params.attendance) {
        if (params.attendance.states) {
            let statusList = []
            let queryStatusList = params.attendance.states
            _.each(queryStatusList, (status) => {
                if (status.code === 'halfDay') {
                    status.code = 'present'
                    query.$or = [{
                        firstHalfStatus: 'A'
                    }, {
                        secondHalfStatus: 'A'
                    }]
                }
                if ((statusList.length = 1 && statusList[0] === 'present') && status === 'present') {
                    return 0
                } else {
                    statusList.push(status.code)
                }
            })
            query['status'] = {
                $in: statusList
            }
        }

        if (params.attendance.checkIn) {
            if (params.attendance.checkIn.states) {
                let checkInStatusList = []
                let queryCheckInStatusList = params.attendance.checkIn.states
                _.each(queryCheckInStatusList, (checkInStatus) => {
                    checkInStatusList.push(checkInStatus.code.toLowerCase())
                })
                query['checkInStatus'] = {
                    $in: checkInStatusList
                }
                query['status'] = 'present'
            }

            if (params.attendance.checkIn.after) {
                let t = params.attendance.checkIn.after.split(':')
                let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
                query['checkIn'] = {
                    $gte: time
                }
            }

            if (params.attendance.checkIn.before) {
                let t = params.attendance.checkIn.before.split(':')
                let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
                query['checkIn'] = {
                    $lte: time
                }
            }
        }

        if (params.attendance.checkOut) {
            if (params.attendance.checkOut.states) {
                let checkOutStatusList = []
                let queryCheckOutStatusList = params.attendance.checkOut.states
                _.each(queryCheckOutStatusList, (checkOutStatus) => {
                    checkOutStatusList.push(checkOutStatus.code.toLowerCase())
                })
                query['checkOutStatus'] = {
                    $in: checkOutStatusList
                }
                query['status'] = 'present'
            }

            if (params.attendance.checkOut.after) {
                let t = params.attendance.checkOut.after.split(':')
                let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
                query['checkOut'] = {
                    $gte: time
                }
            }

            if (params.attendance.checkOut.before) {
                let t = params.attendance.checkOut.before.split(':')
                let time = moment(ofDate).hours(parseInt(t[0])).minutes(parseInt(t[1])).toDate()
                query['checkOut'] = {
                    $lte: time
                }
            }
        }

        if (params.attendance.clocked) {
            if (params.attendance.clocked.states) {
                let hoursList = []
                let queryhoursList = params.attendance.clocked.states
                _.each(queryhoursList, (hours) => {
                    hoursList.push(hours.code.toLowerCase())
                })
                query['hours'] = {
                    $in: hoursList
                }
            }
            if (params.attendance.clocked.hours) {
                if (params.attendance.clocked.hours.greaterThan) {
                    let minutes = (params.attendance.clocked.hours.greaterThan) * 60
                    query['minutes'] = {
                        $gte: minutes
                    }
                }

                if (params.attendance.clocked.hours.lessThan) {
                    let minutes = (params.attendance.clocked.hours.lessThan) * 60
                    query['minutes'] = {
                        $lte: minutes
                    }
                }
            }
        }
    }
    return query
}
exports.data = async (params, context) => {
    let query = extractQuery(params, context)
    let items = await attendanceService.getOneDayAttendances(null, query, context)

    let serialNo = 0
    return items.map(item => {
        let ofDate = new Date()
        if (params.dates && params.dates.from) {
            ofDate = params.dates.from
        }

        let endTime = shiftTypeService.getTimings(item.shift.shiftType, ofDate, context).endTime
        if (item.checkOutExtend) {
            endTime = item.checkOutExtend
        }

        let model = {
            serialNo: serialNo++,
            code: item.employee.code,
            name: item.employee.name,
            shift: item.shift.shiftType.name,
            startTime: dates.date(item.shift.shiftType.startTime).toString('hh:mm a'),
            endTime: dates.date(item.shift.shiftType.endTime).toString('hh:mm a') + (item.checkOutExtend ? '#' : ''),
            realEndTime: dates.date(endTime).toString('hh:mm a'),
            shiftExtended: item.checkOutExtend ? dates.date(item.checkOutExtend).toString('hh:mm a') : '',
            checkIn: item.checkIn ? dates.date(item.checkIn).toString('hh:mm a') : '',
            out1: '',
            in2: '',
            out2: '',
            in3: '',
            out3: '',
            in4: '',
            checkOut: item.checkOut ? dates.date(item.checkOut).toString('hh:mm a') : '',
            inStatus: item.checkInStatus || '',
            outStatus: item.checkOutStatus || '',
            status: item.status || '',
            clocked: dates.minutes(item.minutes).toString(),
            count: item.count,
            overTime: '',
            first: item.firstHalfStatus,
            second: item.secondHalfStatus
        }

        if (model.status !== 'present') {
            model.inStatus = ''
            model.outStatus = ''
        }

        if (dates.date(ofDate).isToday()) {
            model.outStatus = ''
        }

        if (!dates.date(ofDate).isSame(endTime)) {
            model.realEndTime = model.realEndTime + '*'
        }

        if (item.checkOutExtend && !dates.date(ofDate).isSame(item.checkOutExtend)) {
            model.shiftExtended = model.shiftExtended + '*'
        }

        if (item.checkOut && !dates.date(ofDate).isSame(item.checkOut)) {
            model.checkOut = model.checkOut + '*'
        }

        if (item.checkIn && !dates.date(ofDate).isSame(item.checkIn)) {
            model.checkIn = model.checkIn + '*'
        }

        if (item.count && item.count > 1) {
            // model.overTime = item.overTime
            let hours = Math.floor(item.overTime / 60) || '00'
            let minutes = item.overTime % 60 || '00'
            model.overTime = `${hours}h:${minutes}m`
        }
        if (item.checkInStatus === 'late') {
            let lateTime = Math.abs(item.late)
            let late = Math.floor(lateTime / 60) + ':' + lateTime % 60
            model.inStatus = `${late} ${item.checkInStatus}`
        }
        if (item.checkOutStatus === 'early') {
            let earlyTime = Math.abs(item.early)
            let early = Math.floor(earlyTime / 60) + ':' + earlyTime % 60
            model.outStatus = `${early} ${item.checkOutStatus}`
        }

        item.timeLogs.forEach(timeLog => {
            let displayTime = dates.date(timeLog.time).toString('hh:mm a')

            if (!dates.date(ofDate).isSame(timeLog.time)) {
                displayTime = displayTime + '*'
            }

            if (timeLog.source === 'system') {
                // if (timeLog.type === timeLogType.checkOut && item.checkOut && timeLog.time.getTime() === item.checkOut.getTime()) {
                if (timeLog.type === timeLogType.checkOut) {
                    model.checkOut = 'continue'
                }

                // if (timeLog.type === timeLogType.checkIn && item.checkIn && timeLog.time.getTime() === item.checkIn.getTime()) {
                if (timeLog.type === timeLogType.checkIn) {
                    model.checkIn = 'continue'
                }
                return
            }

            if (timeLog.type === timeLogType.checkOut && (
                (item.checkOut && timeLog.time.getTime() !== item.checkOut.getTime()) ||
                    !item.checkOut)) {
                if (!model.out1) {
                    model.out1 = displayTime
                } else if (!model.out2) {
                    model.out2 = displayTime
                } else if (!model.out3) {
                    model.out3 = displayTime
                }
            }

            if (timeLog.type === timeLogType.checkIn && (
                (item.checkIn && timeLog.time.getTime() !== item.checkIn.getTime()) ||
                    !item.checkIn)) {
                if (!model.in2) {
                    model.in2 = displayTime
                } else if (!model.in3) {
                    model.in3 = displayTime
                } else if (!model.in4) {
                    model.in4 = displayTime
                }
            }
        })

        return model
    })
}

exports.headers = async (params, context) => {
    return context.getConfig('reports.daily-attendance.columns') || [{
        label: 'S.No.',
        key: 'serialNo'
    },
    {
        label: 'Code',
        key: 'code'
    },
    {
        label: 'Name',
        key: 'name'
    },
    {
        label: 'Shift',
        key: 'shift'
    },
    {
        label: 'Start Time',
        key: 'startTime'
    },
    {
        label: 'End Time',
        key: 'realEndTime'
    },
    {
        label: 'Shift Extended',
        key: 'shiftExtended'
    },
    {
        label: 'Check In',
        key: 'checkIn'
    },
    {
        label: 'Out Time 1',
        key: 'out1'
    },
    {
        label: 'In Time 2',
        key: 'in2'
    },
    {
        label: 'Out Time 2',
        key: 'out2'
    },
    {
        label: 'In Time 3',
        key: 'in3'
    },
    {
        label: 'Check Out',
        key: 'checkOut'
    },
    {
        label: 'In Status',
        key: 'inStatus'
    },
    {
        label: 'Out Status',
        key: 'outStatus'
    },
    {
        label: 'Over allStatus',
        key: 'status'
    },
    {
        label: 'Hours',
        key: 'clocked'
    },
    {
        label: 'Count',
        key: 'count'
    },
    {
        label: 'OverTime',
        key: 'overTime'
    },
    {
        label: 'Half 1',
        key: 'first'
    },
    {
        label: 'Half 2',
        key: 'second'
    },
    {
        label: 'Remark 1',
        key: 'remark1'
    },
    {
        label: 'Remark 2',
        key: 'remark2'
    }
    ]
}

exports.format = async (params, context) => {
    let narrow = {
        width: 5.0,
        value: {
            align: 'center'
        }
    }
    let wide = {
        width: 20.0
    }

    let medium = {
        width: 8.0,
        value: {
            align: 'center'
        }
    }
    return {
        xlsx: {
            sheet: context.getConfig('reports.daily-attendance.format.xlsx.sheet') || 'Daily Attendance',
            styles: context.getConfig('reports.daily-attendance.format.xlsx.styles') || {
                headers: {},
                values: {},
                serialNo: {
                    width: 5.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        },
                        align: 'center'
                    }
                },
                code: {
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                name: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                checkIn: {
                    width: 16.0,
                    align: 'center'
                },
                checkOut: {
                    width: 16.0,
                    align: 'center'
                },
                in1: medium,
                in2: medium,
                out1: medium,
                out2: medium,

                startTime: medium,
                endTime: medium,
                realEndTime: medium,
                shiftExtended: medium,

                first: narrow,
                second: narrow,
                early: narrow,
                late: narrow,
                count: narrow,
                clocked: narrow,
                overTime: narrow,
                comment: wide

            },
            reportHeader: (sheet) => {
                // format

                var noOfColumns = 18
                var columns = context.getConfig('reports.daily-attendance.columns')
                if (columns) {
                    noOfColumns = columns.length
                }
                sheet.width(1, noOfColumns)
                sheet.merge({
                    col: 1,
                    row: 1
                }, {
                    col: noOfColumns,
                    row: 1
                })
                sheet.font(1, 1, {
                    bold: 'true',
                    sz: '20'
                })
                sheet.align(1, 1, 'center')
                sheet.fill(1, 1, {
                    type: 'solid',
                    fgColor: '8',
                    bgColor: '64'
                })

                // content
                let name = context.getConfig('reports.daily-attendance.name') || 'Daily Attendance Report'
                sheet.set(1, 1, `${name}`)

                const legendColNo = Math.floor(noOfColumns / 2)

                // Date Cell
                sheet.merge({
                    col: 1,
                    row: 2
                }, {
                    col: legendColNo - 1,
                    row: 2
                })
                sheet.font(1, 2, {
                    bold: 'true',
                    sz: '20'
                })
                sheet.align(1, 2, 'left')
                let ofDate = new Date()
                if (params.dates && params.dates.from) {
                    ofDate = params.dates.from
                }
                var date = ofDate || new Date()
                var dateFormat = context.getConfig('formats.date') || 'DD-MM-YYYY'
                sheet.set(1, 2, `Date: ${dates.date(date).toString(dateFormat)}`)

                // Legend cell
                sheet.merge({
                    col: legendColNo,
                    row: 2
                }, {
                    col: noOfColumns,
                    row: 2
                })
                sheet.font(legendColNo, 2, {
                    bold: 'false',
                    sz: '8'
                })
                sheet.align(legendColNo, 2, 'right')
                sheet.set(legendColNo, 2, `* next day, # extended`)

                return 2
            }
        }
    }
}
