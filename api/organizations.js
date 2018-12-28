'use strict'
const mapper = require('../mappers/organization')
const alertTypeHelper = require('../api/alerts')
const uuid = require('uuid')
const _ = require('underscore')
const db = require('../models')

let createOrg = data => {
    return new db.organization(data)
        .save()
}

let addDefaultAlerts = organization => {
    return db.alertType.find({ default: true })
        .then(alertTypes => {
            return Promise.each(alertTypes, alertType => {
                let defaultConfigurations = alertTypeHelper.setDefaultConfigurations(alertType)
                return new db.alert({
                    alertType: alertType,
                    organization: organization,
                    config: defaultConfigurations
                }).save()
            })
        })
}

exports.create = (req, res) => { // use by EMS and AMS too
    let model = req.body
    if (!model.code || !model.name) {
        return res.failure('organization code and name is needed')
    }

    if (!model.externalUrl) {
        return res.failure('externalUrl is needed')
    }
    // when user will create this org then externalUrl otherwise defaulExtUrl

    var data = {
        code: model.code,
        name: model.name,
        externalUrl: model.externalUrl,
        activationKey: uuid.v1()
    }

    if (model.orgId) { // comming from employee Database
        data.EmpDb_Org_id = model.orgId
    }

    createOrg(data)
        .then(org => {
            return addDefaultAlerts(org)
                .then(() => org)
        })
        .then(org => {
            if (model.orgId) { // comming from employee Database
                return res.json({ message: 'org created in ams' })
            }
            res.data(mapper.toModel(org))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.update = (req, res) => {
    let model = req.body
    if (!model.code || !model.name) {
        throw ('organization code and name is needed')
    }

    var data = {
        code: model.code,
        name: model.name // comming from employee database
    }

    if (model.onBoardingStatus) {
        data.onBoardingStatus = model.onBoardingStatus
    };

    var query = {}

    if (model.orgId) {
        query.EmpDb_Org_id = model.orgId
    } else {
        query._id = req.params.id
    }

    db.organization.findOneAndUpdate(query, data, { new: true })
        .then(org => {
            if (model.orgId) { // comming from employee Database
                return res.json({ message: 'org updated in ams' })
            }
            res.data(mapper.toModel(org))
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.get = (req, res) => {
    if (req.params.id === 'my') {
        req.params.id = req.employee.organization.id
    }

    db.organization.findById(req.params.id)
        .populate({
            path: 'communicationApps.sms',
            populate: {
                path: 'type'
            }
        })
        .populate({
            path: 'communicationApps.email',
            populate: {
                path: 'type'
            }
        })
        .populate({
            path: 'communicationApps.chat',
            populate: {
                path: 'type'
            }
        })
        .then(organization => {
            return res.data(mapper.toModel(organization))
        })
        .catch(err => {
            res.failure(err)
        })
}
