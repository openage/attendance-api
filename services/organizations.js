'use strict'
const uuid = require('uuid')
const offline = require('@open-age/offline-processor')
const db = require('../models')

exports.create = async (model, context) => {
    var data = {
        code: model.code,
        name: model.name,
        externalUrl: model.externalUrl,
        // EmpDb_Org_id: model.orgId || model.id,
        externalId: model.orgId || model.id,
        onBoardingStatus: model.onBoardingStatus,
        activationKey: uuid.v1(),
        status: model.status
    }

    let organization = new db.organization(data)
    organization = await organization.save()
    await context.setOrganization(organization)
    context.processSync = true

    context.logger.info(`new organization create ${organization.id}`)
    await offline.queue('organization', 'create', { id: organization.id }, context)

    return organization
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
