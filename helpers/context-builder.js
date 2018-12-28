'use strict'
const db = require('../models')

const create = async (claims, logger) => {
    let context = {
        logger: logger || claims.logger
    }

    let log = context.logger.start('context-builder:create')
    if (claims.organization) {
        if (claims.organization._doc) {
            context.organization = claims.organization
        } else if (claims.organization.id) {
            context.organization = await db.organization.findOne({ _id: claims.organization.id })
        } else if (claims.organization.key) {
            context.organization = await db.organization.findOne({ key: claims.organization.key })
        } else if (claims.organization.code) {
            context.organization = await db.organization.findOne({ code: claims.organization.code })
        }
    }

    if (claims.employee) {
        if (claims.employee._doc) {
            context.employee = claims.employee
        } else if (claims.employee.id) {
            context.employee = await db.employee.findOne({ _id: claims.employee.id })
        }
    }

    if (claims.supervisor) {
        if (claims.supervisor._doc) {
            context.supervisor = claims.supervisor
        } else if (claims.supervisor.id) {
            context.supervisor = await db.supervisor.findOne({ _id: claims.supervisor.id })
        }
    }

    context.config = {}
    if (context.organization && context.organization.config) {
        context.config = context.organization
    }
    context.config.timeZone = context.config.timeZone || 'IST'

    context.permissions = []
    if (context.employee) {
        context.permissions.push(context.employee.userType.toLowerCase())
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
