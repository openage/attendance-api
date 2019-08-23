const db = require('../models')
const moment = require('moment')
const employeeService = require('./employee-getter')

const leaveTypeService = require('./leave-types')
exports.get = async (query, context) => {
    context.logger.start('services/leave-balances:get')

    if (typeof query === 'string' && query.isObjectId()) {
        return db.leaveBalance.findById(query).populate('leaveType')
    }

    if (query.id) {
        return db.leaveBalance.findById(query.id).populate('leaveType')
    }

    if (query.employee && query.leaveType) {
        let balance = await db.leaveBalance.findOne({
            leaveType: query.leaveType,
            employee: query.employee,
            status: 'active'
        }).populate('leaveType')

        if (balance) {
            return balance
        }
        balance = await (new db.leaveBalance({
            leaveType: query.leaveType,
            employee: query.employee,
            units: 0,
            unitsAvailed: 0,
            status: 'active'
        })).save()

        return balance
    }
    return null
}

exports.getByEmployee = async (employee, options, context) => {
    let query = {
        employee: employee.id,
        status: 'active'
    }

    let leaveBalances = await db.leaveBalance.find(query).populate('leaveType')

    options.leaveStates = options.leaveStates || ['approved', 'submitted']

    for (const bal of leaveBalances) {
        bal.approvedLeaves = await db.leave.find({
            leaveType: bal.leaveType.id,
            employee: bal.employee,
            status: { $in: options.leaveStates },
            date: {
                $gte: moment().startOf('year'),
                $lte: moment().endOf('year')
            }
        }).count()
    }

    let leaveTypes = options.leaveTypes

    if (!leaveTypes) {
        leaveTypes = await db.leaveType.find({
            organization: context.organization
        })
    }

    let entities = []

    for (const leaveType of leaveTypes) {
        let balance = leaveBalances.find(item => item.leaveType.id === leaveType.id)
        if (!balance) {
            balance = await (new db.leaveBalance({
                leaveType: leaveType,
                employee: employee.id,
                units: 0,
                unitsAvailed: 0,
                status: 'active'
            })).save()
        }

        entities.push(balance)
    }

    return entities
}

exports.grant = async (id, days, journalModel, context) => {
    let balance = await exports.get(id, context)

    let leaveType = balance.leaveType
    let units = leaveType.unitsPerDay * days

    let log = context.logger.start({
        location: 'grant',
        leaveType: leaveType.id,
        leaveBalance: balance.id,
        employee: balance.employee
    })

    balance.journals = balance.journals || []

    let journal = {}

    if (journalModel.entity && journalModel.entity.id) {
        journal = balance.journals.find(item => {
            return item.entity && item.entity.id === journalModel.entity.id && item.entity.type === journalModel.entity.type
        })

        if (!journal && !days) {
            return balance
        }

        if (!journal) {
            journal = {
                entity: {
                    id: journalModel.entity.id,
                    type: journalModel.entity.type
                }
            }
        }
    }

    balance.units = balance.units - (journal.units || 0) + units

    journal.date = new Date()
    journal.units = units
    journal.comment = journalModel.comment
    journal.meta = journalModel.meta

    if (context.employee) {
        journal.by = context.employee
    }

    if (!journal.id) {
        balance.journals.push(journal)
    }

    await balance.save()

    log.end(`gramted ${units} unit(s)`)

    return balance
}

exports.bulk = async (employees, leaveType, days, journalModel, context) => {
    leaveType = await leaveTypeService.get(leaveType, context)
    employees = await employeeService.search(employees.query, null, context)
    for (const employee of employees) {
        await exports.grant({
            leaveType: leaveType,
            employee: employee
        }, days, journalModel, context)
    }

    return employees.length
}

exports.runOvertimeRules = async (attendance, options, context) => {
    let types = await db.leaveType.find({
        'periodicity.type': 'overtime',
        organization: context.organization
    })

    if (!types || !types.length) {
        return
    }

    for (const type of types) {
        let balance = await exports.get({
            leaveType: type,
            employee: attendance.employee
        }, context)
        let treshold = type.periodicity.value
        let days = 0
        if (treshold && attendance.overTime && attendance.overTime > treshold) {
            let count = Math.floor(attendance.overTime / treshold)
            if (!count) {
                break
            }
            if (count > 1 && !context.getConfig('leave.grant.over-time.multiple')) {
                count = 1
            }

            days = (type.credit * count) / type.unitsPerDay
        }

        await exports.grant(balance.id, days, {
            entity: {
                id: attendance.id.toString(),
                type: 'attendance'
            },
            meta: {
                overTime: attendance.overTime,
                date: attendance.ofDate
            }
        }, context)
    }
}

exports.runWorkDayRules = async (employee, options, context) => {
    let types = await db.leaveType.find({
        'periodicity.type': 'work-day',
        organization: context.organization
    })

    if (!types || !types.length) {
        return
    }

    let till = new Date()

    for (const type of types) {
        let treshold = type.periodicity.value

        let balance = exports.get({
            leaveType: type,
            employee: employee
        }, context)

        balance.journals = balance.journals || []

        let from

        if (balance.journals.length) {
            let journal = balance.journals[balance.journals.length - 1]
            if (moment(journal.date).add(treshold, 'day').isAfter(till)) {
                break
            } else {
                from = journal.meta.till
            }
        } else {
            from = moment().subtract(treshold, 'day').toDate()
        }

        let status = context.getConfig('leave.grant.work-day.states')

        let workDays = db.attendance.find({
            employee: employee,
            ofDate: {
                $gt: from,
                $lte: till
            },
            status: {
                $in: status
            }
        }).count()

        let days = 0
        if (treshold && workDays > treshold) {
            let count = Math.floor(workDays / treshold)
            if (!count) {
                break
            }
            if (count > 1 && !context.getConfig('leave.grant.work-day.multiple')) {
                count = 1
            }

            days = (type.credit * count) / type.unitsPerDay
        }

        exports.grant(balance.id, days, {
            meta: {
                from: from,
                till: till,
                workDays: workDays,
                treshold: treshold
            }
        }, context)
    }
}

/*
periodicity: {
    type: monthly, yearly
    value: 0
}

entity = {
    type: period,
    id: moment(date).format('MM-YYYY')
}
*/

exports.runPeriodRule = async (periodicity, entity, context) => {
    let leaveTypes = await db.leaveTypes.find({
        'periodicity.type': periodicity.type,
        'periodicity.value': periodicity.value === 'start' ? 1 : 0,
        'organization': context.organization
    })

    for (const leaveType of leaveTypes) {
        let log = context.logger.start({
            leaveType: leaveType.id
        })

        let days = leaveType.credit / leaveType.unitsPerDay

        let employees = await db.employee.find({
            organization: context.organization,
            status: 'active'
        }).populate('organization')

        employees = employees || []

        context.logger.debug(`${employees.length} employee(s) fetched`)

        for (const employee of employees) {
            let emloyeeLogger = context.logger.start({
                employee: employee.id
            })
            await exports.grant({
                employee: employee,
                leaveType: leaveType
            }, days, { entity: entity }, context)
            emloyeeLogger.end()
        }

        log.end()
    }
}

exports.search = async (query, pageInput, context) => {
    let employees = await employeeService.search(query, pageInput, context)
    let leaveTypes = await db.leaveType.find({
        organization: context.organization
    })

    let entities = []
    for (const employee of employees) {
        employee.leaveBalances = await exports.getByEmployee(employee, {
            leaveTypes: leaveTypes
        }, context)

        entities.push(employee)
    }

    let page = {
        items: entities
    }

    if (pageInput) {
        page.count = await employeeService.count(query, context)
        page.pageNo = pageInput.pageNo
        page.limit = pageInput.limit
    }

    return page
}
