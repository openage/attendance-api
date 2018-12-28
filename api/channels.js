'use strict'
const _ = require('underscore')
const mapper = require('../mappers/channel')
const updationScheme = require('../helpers/updateEntities')
const db = require('../models')

let inactiveOtherOfSameCategoryType = (channelType, newChannel, organization) => {
    return db.channelType.find({
        category: channelType.category
    }).select('_id')
        .then(channelTypeIds => {
            return new Promise((resolve, reject) => {
                db.channel.update({
                    _id: {
                        $ne: newChannel.id
                    },
                    organization: organization.id,
                    type: {
                        $in: _.pluck(channelTypeIds, '_id')
                    }
                }, { status: 'inactive' })
                    .then(data => {
                        return resolve()
                    })
                    .catch(err => {
                        throw reject()
                    })
            })
        })
        .catch(err => {
            throw err
        })
}

let setInOrg = (channelType, newChannel, organization) => {
    organization.communicationApps[channelType.category] = newChannel
    return organization.save()
}

exports.create = function (req, res) {
    let model = req.body

    if (_.isEmpty(model.config)) {
        return res.failure('can not save without config')
    }

    new db.channel({
        type: model.type.id,
        organization: req.context.organization,
        config: model.config || {}
    })
        .save().then(channel => {
            if (!channel) {
                throw new Error('channel can not created')
            }
            return db.channelType.findById(model.type.id)
                .then(channelType => {
                    return { channelType: channelType, channel: channel }
                })
        })
        .then(data => {
            return Promise.all([
                inactiveOtherOfSameCategoryType(data.channelType, data.channel, req.context.organization),
                setInOrg(data.channelType, data.channel, req.context.organization)
            ])
                .then(result => {
                    return res.data(mapper.toModel(data.channel))
                })
                .catch(err => {
                    console.error(err)
                })
        })
        .catch(err => {
            console.error(err)
        })
}

exports.update = (req, res) => {
    let model = req.body
    let channelId = req.params.id

    db.channel.findById(channelId)
        .populate('type')
        .then(channel => {
            if (model.status === 'active' && channel.status === 'inactive') {
                return inactiveOtherOfSameCategoryType(channel.type, channel, req.context.organization)
                    .then(() => channel)
            }
            return channel
        })
        .then(channel => {
            if (!channel) {
                throw new Error('no channel found while update')
            }
            channel = updationScheme.update(model, channel)
            req.context.organization.communicationApps[channel.type.category] = channel
            return Promise.all([
                req.context.organization.save(),
                channel.save()
            ])
                .spread((org, channel) => channel)
                .catch(err => { throw err })
        })
        .then(channel => res.data(mapper.toModel(channel)))
        .catch(err => res.failure(err))
}
