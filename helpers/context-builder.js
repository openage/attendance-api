'use strict'
const db = require('../models')
const locks = require('./locks')

const defaultConfig = require('config').get('organization')

const searchInConfig = (identifier, config) => {
    var keys = identifier.split('.')
    var value = config

    for (var key of keys) {
        if (!value[key]) {
            return null
        }
        value = value[key]
    }

    return value
}

const create = async (claims, logger) => {
    let context = {
        logger: logger || claims.logger,
        config: defaultConfig,
        permissions: []
    }

    let log = context.logger.start('context-builder:create')
    context.setOrganization = async (organization) => {
        if (!organization) {
            return
        }
        if (organization._doc) {
            context.organization = organization
        } else if (organization.id) {
            context.organization = await db.organization.findOne({ _id: organization.id })
        } else if (organization.key) {
            context.organization = await db.organization.findOne({ key: organization.key })
        } else if (organization.code) {
            context.organization = await db.organization.findOne({ code: organization.code })
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

    context.setUser = async (employee) => {
        if (!employee) {
            return
        }
        if (employee._doc) {
            context.employee = employee
        } else if (employee.id) {
            context.employee = await db.employee.findOne({ _id: employee.id })
        }

        context.permissions.push(employee.userType)

        context.logger.context.user = {
            id: context.employee.id,
            code: context.employee.code
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

    await context.setOrganization(claims.organization)
    await context.setUser(claims.employee)
    await context.setSupervisor(claims.supervisor)

    context.getConfig = (identifier, defaultValue) => {
        var value = searchInConfig(identifier, context.config)
        if (!value) {
            value = searchInConfig(identifier, defaultConfig)
        }
        if (!value) {
            value = defaultValue
        }
        return value
    }

    context.hasPermission = (request) => {
        if (!request) {
            return false
        }

        let items = Array.isArray(request) ? request : [request]

        return context.permissions.find(permission => {
            return items.find(item => item.toLowerCase() === permission)
        })
    }

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
