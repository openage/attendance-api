'use strict'
const mapper = require('../mappers/alertType')
const updationScheme = require('../helpers/updateEntities')
const _ = require('underscore')
const offline = require('@open-age/offline-processor')
const db = require('../models')

exports.create = (req, res) => {
    let model = req.body

    let data = {
        name: model.name,
        description: model.description,
        picUrl: model.picUrl,
        cost: model.cost,
        default: model.default,
        code: model.code,
        trigger: model.trigger,
        processor: model.processor
    }

    db.alertType.findOrCreate({
        code: data.code,
        name: {
            $regex: data.name || '',
            $options: 'ig'
        }
    }, data)
        .then(figures => {
            if (data.default) {
                var context = {}
                context.organization = {}
                context.employee = req.employee.id.toString()
                context.organization.id = req.employee.organization.toString()
                context.processSync = true
                return offline.queue('organization', 'alerts', { alert: figures.result }, context)
            }
            return res.data(mapper.toModel(figures.result))
        }).catch(err => res.failure(err))
}

exports.update = (req, res) => {
    let model = req.body
    let alertTypeId = req.params.id

    db.alertType.findById({
        _id: alertTypeId
    }).then(alertType => {
        alertType = updationScheme.update(model, alertType)
        return alertType.save()
    })
        .then(alertType => res.data(mapper.toModel(alertType)))
        .catch(err => res.failure(err))
}

exports.search = async (req, res) => {
    let query = {}
    if (!req.query.all) {
        let org = req.body.orgCode || req.query.orgCode || req.headers['org-code']
        let myOrg = await db.organization.findOne({ code: org.toLowerCase() })
        await db.alert.find({ organization: myOrg }).select('alertType')
            .then(alerts => {
                query = { _id: { $nin: _.pluck(alerts, 'alertType') }, default: false }
            })
    }
    return db.alertType.find(query)
        .then(alertTypes => res.page(mapper.toSearchModel(alertTypes)))
        .catch(err => req.failure(err))
}

exports.get = (req, res) => {
    let alertType = req.params.id

    db.alertType.findById(alertType)
        .then(alertType => {
            if (!alertType) {
                throw new Error('no alertType found')
            }
            return res.data(mapper.toModel(alertType))
        })
        .catch(err => res.failure(err))
}

// exports.addChannel = (req, res) => {

//     let model = req.body;
//     let alertTypeId = req.params.channelId;

//     db.alertType.update({
//             _id: alertTypeId
//         }, {
//             $addToSet: { channels: model.channel }
//         })
//         .then(alertType => {
//             return res.success('alertType Successfully updated');
//         })
//         .catch(err => res.failure(err));
// };
