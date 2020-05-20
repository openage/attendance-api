'use strict'
const db = require('../models')
const locks = require('./locks')

const defaultConfig = require('config').get('organization')

const users = require('../services/users')

exports.create = async (claims, logger) => {
    let context = {
        id: claims.id,
        logger: logger || claims.logger,
        config: defaultConfig,
        permissions: []
    }

    context.getConfig = (identifier, defaultValue) => {
        let keys = identifier.split('.')
        let value = context.config

        for (let key of keys) {
            if (!value[key]) {
                value = null
                break
            }
            value = value[key]
        }

        if (!value) {
            value = defaultConfig
            for (let key of keys) {
                if (!value[key]) {
                    return defaultValue
                }
                value = value[key]
            }
        }

        return value
    }

    let log = context.logger.start('context-builder:create')

    context.setUser = async (user) => {
        if (!user) {
            return
        }
        if (user._bsontype === 'ObjectId' || user._bsontype === 'ObjectID') {
            context.user = await db.user.findById(user)
        } else if (user._doc) {
            context.user = user
        } else if (user.id) {
            context.user = await users.get(user.id)
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

        context.logger.context.user = {
            id: context.user.id,
            code: context.user.code
        }
    }

    context.setSupervisor = async (supervisor) => {
        if (!supervisor) {
            return
        }
        if (supervisor._bsontype === 'ObjectId' || supervisor._bsontype === 'ObjectID') {
            context.supervisor = await db.user.findById(supervisor.id.toString())
        } else if (supervisor._doc) {
            context.supervisor = supervisor
        } else if (supervisor.id) {
            context.supervisor = await db.user.findOne({ _id: supervisor.id })
        }
    }

    context.setOrganization = async (organization) => {
        if (!organization) {
            return
        }
        if (organization._bsontype === 'ObjectID' || organization._bsontype === 'ObjectId') {
            context.organization = await db.organization.findById(organization).populate('tenant')
        } else if (organization._doc) {
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
        if (tenant._bsontype === 'ObjectId' || tenant._bsontype === 'ObjectID') {
            context.tenant = await db.tenant.findById(tenant)
        } else if (tenant._doc) {
            context.tenant = tenant
        } else if (tenant.id) {
            context.tenant = await db.tenant.findById(tenant.id)
        } else if (tenant.key) {
            context.tenant = await db.tenant.findOne({ key: tenant.key })
        } else if (tenant.code) {
            context.tenant = await db.tenant.findOne({ code: tenant.code })
        }

        if (!context.tenant) { return }

        context.logger.context.tenant = {
            id: context.tenant.id,
            code: context.tenant.code
        }
    }

    if (claims.role && claims.role.key) {
        claims.user = await users.get(claims.role.key, context)
    }

    await context.setTenant(claims.tenant || claims.user.tenant)
    await context.setOrganization(claims.organization || claims.user.organization)
    await context.setUser(claims.user || claims.user)
    await context.setSupervisor(claims.supervisor || claims.user.supervisor)


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

    if (context.user) {
        serialized.userId = context.user.id
    }

    if (context.tenant) {
        serialized.tenantId = context.tenant.id
    }

    if (context.organization) {
        serialized.organizationId = context.organization.id
    }

    return serialized
}

exports.deserializer = async (claims, logger) => {
    return exports.create(claims, logger)
}
