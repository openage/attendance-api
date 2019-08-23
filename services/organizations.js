'use strict'
const uuid = require('uuid')
const offline = require('@open-age/offline-processor')
const db = require('../models')

const set = async (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.shortName) {
        entity.shortName = model.shortName
    }

    if (model.logo) {
        entity.logo = {
            url: model.logo.url,
            thumbnail: model.logo.thumbnail
        }
    }

    if (model.config) {
        entity.config = model.config
    }
    if (model.status) {
        entity.status = model.status
    }
}

exports.create = async (model, context) => {
    let organization = new db.organization({
        code: model.code.toLowerCase(),
        activationKey: uuid.v1(),
        status: 'active',
        tenant: context.tenant
    })
    await set(model, organization, context)
    await organization.save()
    // await context.setOrganization(organization)
    context.logger.debug(`new organization created ${organization.id}`)
    await offline.queue('organization', 'create', organization, context)
    return organization
}

exports.update = async (id, model, context) => {
    if (id === 'me') {
        id = context.organization.id
    }

    let entity = await db.organization.findById(id)

    await set(model, entity, context)

    return entity.save()
}
const getByCode = async (code, context) => {
    return db.organization.findOne({ code: code })
}

exports.getByCodes = (orgCodes, context) => {
    let where = {}

    if (orgCodes && orgCodes.length) {
        let include = []
        let exclude = []

        orgCodes.forEach(element => {
            if (element.startsWith('^')) {
                exclude.push(element.substr(1))
            } else {
                include.push(element)
            }
        })

        if (include.length || exclude.length) {
            where.code = {}

            if (include.length) {
                where.code['$in'] = include
            }

            if (exclude.length) {
                where.code['$nin'] = exclude
            }
        }
        context.logger.info(`including orgs ${include.join()}`)
        context.logger.info(`excluding orgs ${exclude.join()}`)
    }

    return db.organization.find(where)
}

exports.getByCode = getByCode

exports.get = async (query, context) => {
    let log = context.logger.start('services/organizations:get')
    let entity
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query === 'my') {
            return context.organization
        }
        if (query.isObjectId()) {
            return db.organization.findById(query)
        }
        where['code'] = query
        return db.organization.findOne(where)
    } else if (query.id) {
        if (query.id === 'my') {
            return context.organization
        }
        return db.organization.findById(query.id)
    } else if (query.code) {
        where['code'] = query.code
        return db.organization.findOne(where)
    }
    log.end()
    return entity
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }
    if (!page || !page.limit) {
        return {
            items: await db.organization.find(where)
        }
    }
    return {
        items: await db.organization.find(where).limit(page.limit).skip(page.skip),
        count: await db.organization.count(where)
    }
}
