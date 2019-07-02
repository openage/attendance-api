'use strict'
// const tenants = require('./tenants')

const db = require('../models')
const organizations = require('./organizations')
const employeeService = require('./employees')
const directory = require('@open-age/directory-client')
const contextBuilder = require('../helpers/context-builder')

exports.getFromDirectory = async (roleKey, logger) => {
    const log = logger.start('services/users:getFromDirectory')
    let employee = await db.employee.findOne({ 'role.key': roleKey }).populate('organization')
    if (employee) {
        return employee
    }

    const role = await directory.roles.get(roleKey)
    logger.debug(role)

    if (!role) {
        log.error(`could not find any role with key ${roleKey}`)
        return null
    }

    if (!role.employee) {
        log.error(`could not find any employee with key ${roleKey}`)
        return null
    }

    let context = await contextBuilder.create({}, logger)

    // context.tenant = await tenants.getByCode(role.tenant.code, context) ||
    //     await tenants.create(role.tenant, context)

    if (role.organization) {
        let organization = await organizations.getByCode(role.organization.code, context)

        if (!organization) {
            organization = await organizations.create(role.organization, context)
        }

        context.organization = organization
    }

    employee = await db.employee.findOne({ 'role.id': role.id }).populate('organization')

    if (!employee) {
        employee = await db.employee.findOne({
            code: role.employee.code,
            organization: context.organization
        }).populate('organization')
    }

    if (!employee) {
        var model = populateModel(role, context)
        employee = await employeeService.updateCreateEmployee(model, context)
    }

    employee.role = employee.role || {}
    employee.role.id = `${role.id}`
    employee.role.code = role.code
    employee.role.key = role.key
    employee.role.permissions = role.permissions || []

    await employee.save()
    log.end()
    return employee
}

const populateModel = (role, context) => {
    var employee = role.employee

    var model = {
        status: 'active',
        role: role,
        code: role.employee.code,
        EmpDb_Emp_id: role.employee.id,
        organization: context.organization
    }

    let firstName = role.user.profile.firstName
    let lastName = role.user.profile.lastName
    let picUrl = role.user.profile.pic.url
    let gender = role.user.profile.gender
    let dob = role.user.profile.dob

    let phone = role.user.profile.phone
    let email = role.user.profile.email

    if (employee.profile) {
        firstName = employee.profile.firstName
        lastName = employee.profile.lastName
        picUrl = employee.profile.pic.url
        gender = employee.profile.gender
        dob = employee.profile.dob

        phone = role.employee.profile.phone
        email = role.employee.profile.email
    }
    model.name = `${firstName} ${lastName}`.trim()
    model.picUrl = picUrl
    model.gender = gender
    model.phone = phone
    model.email = email
    model.dob = dob

    model.userType = employee.type
    model.designation = employee.designation
    model.department = employee.department

    let miscellaneous = employee.miscellaneous || {}

    model.contractor = miscellaneous.contractor

    return model
}
