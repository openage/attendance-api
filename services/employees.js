'use strict'
const offline = require('@open-age/offline-processor')

const shiftTypeService = require('./shift-types')
const attendanceService = require('./attendances')
const userGetter = require('./employee-getter')
const monthlySummaryService = require('./monthly-summaries')

const dates = require('../helpers/dates')
const db = require('../models')

const biometricService = require('./biometrics')

const mergeEmployee = async () => {
    // TODO: implement this
    return null
}

const setBiometricCode = async (employee, biometricCode, context) => {
    let existingEmployee = await db.employee.findOne({
        biometricCode: biometricCode,
        organization: context.organization
    })

    if (existingEmployee && existingEmployee.status === 'active') {
        throw new Error(`Employee with code '${existingEmployee.code}' is using this biometric code`)
    }

    if (existingEmployee && existingEmployee.status === 'temp') {
        await mergeEmployee(employee, existingEmployee, context)
    }

    if (employee.biometricCode && biometricCode && employee.biometricCode !== biometricCode) {
        await biometricService.updateCode(employee, biometricCode, context)
    }

    employee.biometricCode = biometricCode

    return employee
}

const setSupervisor = async (employee, supervisor, context) => {
    let newSupervisor = await db.employee.findOne({
        code: supervisor.code,
        organization: context.organization
    })

    if (!newSupervisor) {
        supervisor.shiftType = employee.shiftType
        newSupervisor = await exports.create(supervisor, context)
    }

    employee.supervisor = newSupervisor

    return employee
}

const setShiftType = async (employee, shiftTypeModel, context) => {
    if (employee.shiftType && (employee.shiftType.id === shiftTypeModel.id || employee.shiftType.code === shiftTypeModel.code)) {
        return employee
    }

    let shiftType = await shiftTypeService.get(shiftTypeModel, context)
    employee.shiftType = shiftType

    await attendanceService.setShift(dates.date(new Date()).bod(), employee, shiftType, context)

    return employee
}

const weeklyOff = (employee, weeklyOffModel) => {
    employee.weekOff = employee.weekOff || {}

    if (weeklyOffModel.sunday !== undefined) {
        employee.weeklyOff.sunday = weeklyOffModel.sunday
    }
    if (weeklyOffModel.monday !== undefined) {
        employee.weeklyOff.monday = weeklyOffModel.monday
    }
    if (weeklyOffModel.tuesday !== undefined) {
        employee.weeklyOff.tuesday = weeklyOffModel.tuesday
    }
    if (weeklyOffModel.wednesday !== undefined) {
        employee.weeklyOff.wednesday = weeklyOffModel.wednesday
    }
    if (weeklyOffModel.thursday !== undefined) {
        employee.weeklyOff.thursday = weeklyOffModel.thursday
    }
    if (weeklyOffModel.friday !== undefined) {
        employee.weeklyOff.friday = weeklyOffModel.friday
    }
    if (weeklyOffModel.saturday !== undefined) {
        employee.weeklyOff.saturday = weeklyOffModel.saturday
    }

    employee.weeklyOff.isConfigured = employee.weeklyOff.sunday ||
        employee.weeklyOff.monday ||
        employee.weeklyOff.tuesday ||
        employee.weeklyOff.wednesday ||
        employee.weeklyOff.thursday ||
        employee.weeklyOff.friday ||
        employee.weeklyOff.saturday

    return employee
}

const setProfile = (employee, profile, context) => {
    employee.profile = employee.profile || {}

    if (profile.firstName) {
        employee.profile.firstName = profile.firstName
        employee.name = profile.firstName
    }

    if (profile.lastName) {
        employee.profile.lastName = profile.lastName
        employee.name = `${employee.profile.firstName} ${employee.profile.lastName}`
    }

    if (profile.pic) {
        employee.profile.pic = {
            url: profile.pic.url,
            thumbnail: profile.pic.thumbnail
        }

        employee.picData = employee.profile.pic.thumbnail
        employee.picUrl = employee.profile.pic.url
    } else if (profile.picUrl) {
        employee.profile.pic = {
            url: profile.picUrl,
            thumbnail: profile.picUrl
        }

        employee.picData = employee.profile.pic.thumbnail
        employee.picUrl = employee.profile.pic.url
    }

    if (profile.gender) {
        employee.profile.gender = profile.gender
        employee.gender = profile.gender
    }

    if (profile.fatherName) {
        employee.profile.fatherName = profile.fatherName
        employee.fatherName = profile.fatherName
    }

    if (profile.dob) {
        employee.profile.dob = profile.dob
        employee.dob = profile.dob
    }

    if (profile.name) {
        employee.name = profile.name
    }

    return employee
}

const setEntity = async (user, model, context) => {
    user = setProfile(user, model.profile || model, context)
    if (model.code) {
        user.code = model.code
    }

    if (model.phone) {
        user.phone = model.phone
    }
    if (model.email) {
        user.email = model.email
    }

    if (model.biometricCode && user.biometricCode !== model.biometricCode) {
        user = await setBiometricCode(user, model.biometricCode, context)
    }

    if (model.supervisor && model.supervisor.code && (!user.supervisor || user.supervisor.code !== model.supervisor.code)) {
        user = await setSupervisor(user, model.supervisor, context)
    }

    if (model.isDynamicShift !== undefined) {
        let shiftTypes = await shiftTypeService.search({
            employeeId: model.id,
            isDynamicShift: true
        }, context)

        if (shiftTypes && shiftTypes.length) {
            user.isDynamicShift = model.isDynamicShift
        } else if (shiftTypes && shiftTypes.length === 0) {
            return `No dynamicShift found for employee with code: ${model.code}`
        }
    }

    if (model.token) {
        user.token = model.token
    }

    if (model.designation) {
        if (typeof model.designation === 'string') {
            user.designation = model.designation
        } else {
            user.designation = model.designation.name
        }
    }

    if (model.division) {
        if (typeof model.division === 'string') {
            user.division = model.division
        } else {
            user.division = model.division.name
        }
    }

    if (model.department) {
        if (typeof model.department === 'string') {
            user.department = model.department
        } else {
            user.department = model.department.name
        }
    }
    if (model.config) {
        user.config = model.config

        if (model.config.employmentType === 'contract') {
            if (model.config && model.config.contractor) {
                if (typeof model.config.contractor === 'string') {
                    user.contractor = model.config.contractor
                } else {
                    user.contractor = model.config.contractor.name
                }
            }
        } else if (model.config.employmentType === 'permanent') {
            user.contractor = ''
        }
    }

    if (model.userType) {
        user.userType = model.userType
    }

    if (model.dol || model.deactivationDate) {
        user.deactivationDate = model.dol || model.deactivationDate
    } else if (user.status !== model.status && model.status === 'inactive' && !user.deactivationDate) {
        user.deactivationDate = dates.date().eod()
    }

    if (model.status) {
        if (user.status !== model.status && model.status === 'inactive') {
            await biometricService.remove(user, context)
        }
        user.status = model.status
    }

    if (model.role) {
        user.role = user.role || {}
        user.role.id = model.role.id
        user.role.code = model.role.code
        user.role.key = model.role.key
        user.role.permissions = model.role.permissions || []
    }

    if (model.shiftType) {
        user = await setShiftType(user, model.shiftType, context)
    }

    if (model.weeklyOff) {
        user = await weeklyOff(user, model.weeklyOff, context)
    }

    if (model.abilities) {
        user.abilities = user.abilities || {}
        Object.keys(model.abilities).forEach(key => {
            user.abilities[key] = model.abilities[key]
        })
        user.markModified('abilities')
    }

    if (!user.isNew) {
        await monthlySummaryService.updateEmployee(user, context)
    }

    return user
}

exports.create = async (model, context) => {
    let log = context.logger.start('services/employees:create')

    if (!model) {
        return
    }

    let user = await userGetter.get(model, context)

    let isNew = false
    if (!user) {
        isNew = true
        user = new db.employee({
            status: model.status || 'active',
            EmpDb_Emp_id: model.tackingId,
            role: {
                id: model.role.id,
                code: model.role.code
            },
            organization: context.organization,
            tenant: context.tenant
        })
    }
    await setEntity(user, model, context)
    await user.save()
    if (isNew) {
        await offline.queue('employee', 'new', user, context)
    }
    log.end()
    return user
}

exports.update = async (id, model, context) => {
    let log = context.logger.start('services/employees:update')
    let employee = await userGetter.get(id, context)
    await setEntity(employee, model, context)
    await employee.save()
    log.end()
    return employee
}

exports.get = async (query, context) => {
    return userGetter.get(query, context)
}

/**
 * get employees by code in an org,
 * if one does not exist, it creates one with default values
 */
exports.getByCode = async (code, context) => {
    let employee = await db.employee.findOne({
        code: code,
        organization: context.organization
    }).populate({
        path: 'shiftType'
    }).populate('supervisor')

    if (employee) {
        return employee
    }

    let shiftType = await db.shiftType.findOne({
        code: 'gen',
        organization: context.organization
    })

    if (!shiftType) {
        throw new Error(`no shift type of code 'gen' available in org '${context.organization.code}'`)
    }

    employee = new db.employee({
        code: code,
        organization: context.organization,
        shiftType: shiftType
    })
    await employee.save()

    return employee
}
