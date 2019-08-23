'use strict'
const db = require('../models')
const locks = require('./locks')

const defaultConfig = require('config').get('organization')

const directory = require('@open-age/directory-client')
const tenants = require('../services/tenants')
const organizations = require('../services/organizations')
const users = require('../services/employees')

const toUserModel = (directoryRole) => {
    const toEntity = (entity) => {
        return {
            tackingId: entity._id || entity.id,
            code: entity.code,
            profile: entity.profile,
            designation: entity.designation,
            department: entity.department,
            division: entity.division,

            email: entity.email,
            phone: entity.phone
        }
    }

    let model

    if (directoryRole.employee) {
        model = toEntity(directoryRole.employee)
        model.type = 'emloyee'
    } else if (directoryRole.student) {
        model = toEntity(directoryRole.student)
        model.type = 'student'
    }

    model.code = model.code || directoryRole.code
    model.profile = model.profile || directoryRole.profile
    model.email = directoryRole.email
    model.phone = directoryRole.phone

    model.role = {
        id: directoryRole.id,
        code: directoryRole.code,
        key: directoryRole.key,
        permissions: directoryRole.permissions
    }

    return model
}

const getUserByRoleKey = async (roleKey, logger) => {
    let log = logger.start('getUserByRoleKey')

    let user = await db.employee.findOne({
        'role.key': roleKey
    }).populate('organization tenant')

    if (user) { return user }

    let role = await directory.getRole(roleKey, { logger: log })

    log.debug(role)

    if (!role) {
        throw new Error('ROLE_KEY_INVALID')
    }

    const context = await exports.create({}, logger)

    if (role.tenant) {
        let tenant = await tenants.get({
            code: role.tenant.code
        }, context)

        if (!tenant) {
            tenant = await tenants.create(role.tenant, context)
        }

        await context.setTenant(tenant)
    }

    if (role.organization) {
        let organization = await organizations.get({
            code: role.organization.code
        }, context)

        if (!organization) {
            organization = await organizations.create(role.organization, context)
        }
        await context.setOrganization(organization)
    }

    user = await users.create(toUserModel(role), context)

    log.end()
    return user
}

const create = async (claims, logger) => {
    let context = {
        id: claims.id,
        logger: logger || claims.logger,
        config: defaultConfig,
        permissions: []
    }

    let log = context.logger.start('context-builder:create')

    if (claims.role && claims.role.key) {
        claims.user = await getUserByRoleKey(claims.role.key, log)
    }

    context.setUser = async (user) => {
        if (!user) {
            return
        }
        if (user._doc) {
            context.user = user
        } else if (user.id) {
            context.user = await db.user.findById(user.id).populate('organization tenant')
        }

        if (!context.tenant) {
            await context.setTenant(context.user.tenant)
        }

        if (!context.organization) {
            await context.setOrganization(context.user.organization)
        }

        if (user.role && user.role.permissions) {
            context.permissions.push(...user.role.permissions)
        }

        context.employee = context.user // TODO: obsolete
        context.permissions.push(user.userType) // TODO: obsolete

        context.logger.context.user = {
            id: context.user.id,
            code: context.user.code
        }
    }

    context.setSupervisor = async (supervisor) => {
        if (!supervisor) {
            return
        }
        if (supervisor._doc) {
            context.supervisor = supervisor
        } else if (supervisor.id) {
            context.supervisor = await db.supervisor.findOne({ _id: supervisor.id })
        }
    }

    context.setOrganization = async (organization) => {
        if (!organization) {
            return
        }
        if (organization._doc) {
            context.organization = organization
        } else if (organization.id) {
            context.organization = await db.organization.findById(organization.id).populate('tenant')
        } else if (organization.key) {
            context.organization = await db.organization.findOne({ key: organization.key }).populate('tenant')
        } else if (organization.code) {
            context.organization = await db.organization.findOne({
                code: organization.code,
                tenant: context.tenant
            }).populate('tenant')
        } else {
            context.organization = await db.organization.findById(organization).populate('tenant')
        }

        if (context.organization.config) {
            context.config = context.organization.config
            context.config.timeZone = context.config.timeZone || 'IST'
        }

        context.logger.context.organization = {
            id: context.organization.id,
            code: context.organization.code
        }
    }

    context.setTenant = async (tenant) => {
        if (!tenant) {
            return
        }
        if (tenant._doc) {
            context.tenant = tenant
        } else if (tenant.id) {
            context.tenant = await db.tenant.findOne({ _id: tenant.id })
        } else if (tenant.key) {
            context.tenant = await db.tenant.findOne({ key: tenant.key })
        } else if (tenant.code) {
            context.tenant = await db.tenant.findOne({ code: tenant.code })
        }

        context.logger.context.tenant = {
            id: context.tenant.id,
            code: context.tenant.code
        }
    }

    await context.setTenant(claims.tenant)
    await context.setOrganization(claims.organization)
    await context.setUser(claims.user)
    await context.setSupervisor(claims.supervisor)

    context.where = () => {
        let clause = {}

        if (context.organization) {
            clause.organization = context.organization.id.toObjectId()
        }
        let filters = {}

        filters.add = (field, value) => {
            if (value) {
                clause[field] = value
            }
            return filters
        }

        filters.clause = clause

        return filters
    }

    context.lock = async (resource) => {
        return locks.acquire(resource, context)
    }

    context.setProgress = async (value, outOf) => {
        if (!context.task) {
            return
        }

        let task = await db.task.findById(context.task.id)
        task.progress = Math.floor(100 * value / outOf)
        context.task = await task.save()
    }

    log.end()

    return context
}

exports.serializer = async (context) => {
    let serialized = {}

    if (context.employee) {
        serialized.employeeId = context.employee.id
    }

    if (context.organization) {
        serialized.organizationId = context.organization.id
    }

    return serialized
}

exports.deserializer = async (serialized, logger) => {
    let claims = {}

    if (serialized.employeeId) {
        claims.employee = {
            id: serialized.employeeId
        }
    }

    if (serialized.organizationId) {
        claims.organization = {
            id: serialized.organizationId
        }
    }

    return create(claims, logger)
}

exports.create = create
