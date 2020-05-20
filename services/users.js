'use strict'
const db = require('../models')
const directory = require('@open-age/directory-client')

const validator = require('validator')

const tenantService = require('./tenants')
const organizationService = require('./organizations')
const populate = 'shiftType supervisor'
const employeeGetter = require('./employee-getter')

const set = async (model, entity, context) => {
    if (model.status) {
        entity.status = model.status
    }

    if (model.email && validator.isEmail(model.email)) {
        entity.email = model.email.toLowerCase().replace(' ', '')
    }

    if (model.phone && validator.isMobilePhone(model.phone)) {
        entity.phone = model.phone.trim().replace(' ', '')
    }

    if (model.userId) {
        entity.trackingId = model.userId
    }

    if (model.code) {
        entity.code = model.code
    }

    if (model.supervisor) {
        entity.supervisor = model.supervisor
    }

    if (model.profile) {
        entity.profile = entity.profile || {}
        entity.profile.firstName = model.profile.firstName
        entity.profile.lastName = model.profile.lastName
        entity.profile.gender = model.profile.gender
        entity.profile.dob = model.profile.dob
        model.profile.pic = model.profile.pic || {}
        entity.profile.pic = {
            url: model.profile.pic.url,
            thumbnail: model.profile.pic.thumbnail
        }
    }

    if (model.role) {
        entity.role = entity.role || {}
        if (entity.role.id && model.role.id && model.role.id !== entity.role.id) {
            // role id cannot be changed
            throw new Error('ID_IMMUTABLE')
        } else if (!entity.role.id && model.role.id) {
            entity.role.id = model.role.id
        }
        if (model.role.key) {
            entity.role.key = model.role.key
        }

        if (model.role.code) {
            entity.role.code = model.role.code
        }

        if (model.role.permissions) {
            entity.role.permissions = model.role.permissions
        }
    }
}

const getFromDirectory = async (query, context) => {
    let role = await directory.roles.get(query, context)

    if (!role) {
        throw new Error('ROLE_NOT_FOUND')
    }

    let user = await db.user.findOne({
        'role.id': role.id
    }).populate(populate)

    if (role.tenant && context.tenant && role.tenant.code !== context.tenant.code) {
        throw new Error('ROLE_INVALID')
    }

    if (role.organization && context.organization && role.organization.code !== context.organization.code) {
        throw new Error('ROLE_INVALID')
    }

    if (role.tenant && !context.tenant) {
        let tenant = await tenantService.get({
            code: role.tenant.code
        }, context)

        if (!tenant) {
            tenant = await tenantService.create(role.tenant, context)
        }

        await context.setTenant(tenant)
    }

    if (role.organization && !context.organization) {
        let organization = await organizationService.get({
            code: role.organization.code
        }, context)

        if (!organization) {
            organization = await organizationService.create(role.organization, context)
        }

        await context.setOrganization(organization)
    }

    if (!user) {
        user = new db.user({
            role: {
                id: role.id
            },
            tenant: context.tenant,
            organization: context.organization,
            status: 'new'
        })
    }

    let model = {
        role: {
            id: role.id,
            code: role.code,
            key: role.key,
            permissions: role.permissions
        },
        code: role.code,
        email: role.email,
        phone: role.phone,
        profile: role.profile,
        status: role.status
    }

    if (role.user) {
        model.phone = model.phone || role.user.phone
        model.email = model.email || role.user.email
        model.status = model.status || role.user.status
        if (role.user.profile) {
            model.profile = role.user.profile
        }
    }

    if (role.employee) {
        model.tackingId = role.employee.id
        model.profile = role.employee.profile || model.profile
        model.designation = role.employee.designation
        model.department = role.employee.department
        model.division = role.employee.division
        model.phone = role.employee.phone || model.phone
        model.email = role.employee.email || model.email
        model.code = role.employee.code || model.code
        model.type = 'employee'
        if (role.employee.supervisor && role.employee.supervisor.code) {
            model.supervisor = await employeeGetter.get(role.employee.supervisor.code, context)
        }
    } else if (role.student) {
        model.tackingId = role.student.id
        model.profile = role.student.profile || model.profile
        model.designation = role.student.batch
        model.department = role.student.course
        model.division = role.student.institute
        model.phone = role.student.phone || model.phone
        model.email = role.student.email || model.email
        model.code = role.student.code || model.code
        model.type = 'student'
    }

    await set(model, user, context)

    return user.save()
}

const getByCode = async (code, context) => {
    context.logger.start('services/users:getByCode')

    let user = await db.user.findOne({
        code: code.toLowerCase(),
        tenant: context.tenant,
        organization: context.organization
    }).populate(populate)

    if (!user) {
        user = await db.user.findOne({
            'role.code': code.toLowerCase(),
            tenant: context.tenant,
            organization: context.organization
        }).populate(populate)

        if (user) {
            user.code = user.role.code
            await user.save()
        }
    }

    if (user) { return user }

    return getFromDirectory(code, context)
}

const getByRoleId = async (roleId, context) => {
    context.logger.start('services/users:getById')

    let user = await db.user.findOne({
        'role.id': roleId
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(roleId, context)
}

const getByEmail = async (email, context) => {
    context.logger.start('services/users:getByEmail')

    let user = await db.user.findOne({
        email: email.toLowerCase(),
        organization: context.organization,
        tenant: context.tenant
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(email, context)
}

const getByPhone = async (phone, context) => {
    context.logger.start('services/users:getByPhone')

    let user = await db.user.findOne({
        phone: phone,
        organization: context.organization,
        tenant: context.tenant
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(phone, context)
}

exports.create = async (model, context) => {
    let user = null

    user = await exports.get(model, context)

    if (!user) {
        user = new db.user({
            tenant: context.tenant,
            organization: context.organization,
            status: 'new'
        })
    }

    await set(model, user, context)
    return user.save()
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query === 'my') {
            return context.user
        } else if (query.isObjectId()) {
            return db.user.findById(query).populate(populate)
        } else if (query.isUUID()) {
            return getByKey(query, context)
        } else if (query.isEmail()) {
            return getByEmail(query, context)
        } else if (query.isPhone()) {
            return getByPhone(query, context)
        } else {
            return getByCode(query, context)
        }
    }

    if (query._doc) {
        return query
    }

    if (query.id) {
        if (query.id === 'my') {
            return context.user
        }
        return db.user.findById(query.id).populate(populate)
    }

    if (query.code) {
        if (query.code === 'my') {
            return context.user
        }
        return getByCode(query.code, context)
    }

    if (query.role && query.role.id) {
        return getByRoleId(query.role.id, context)
    }

    if (query.email) {
        return getByEmail(query.email, context)
    }

    if (query.phone) {
        return getByPhone(query.phone, context)
    }

    if (query.trackingId) {
        return db.user.findOne({
            trackingId: query.trackingId,
            tenant: context.tenant,
            organization: context.organization
        }).populate(populate)
    }

    return null
}

const getByKey = async (roleKey, context) => {
    context.logger.start('services/users:getByKey')

    let user = await db.user.findOne({
        'role.key': roleKey
    }).populate(populate)

    if (user) { return user }

    return getFromDirectory(roleKey, context)
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant,
        organization: context.organization
    }

    if (query.text) {
        if (validator.isEmail(query.text)) {
            where.email = query.text.toLowerCase()
        } else if (validator.isMobilePhone(query.text)) {
            where.phone = query.text.trim().replace(' ', '')
        }
    }

    return {
        items: await (page ? db.user.find(where).skip(page.skip).limit(page.limit) : db.user.find(where)),
        count: await db.user.count(where)
    }
}
