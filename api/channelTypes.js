'use strict'
const mapper = require('../mappers/channelType')
const logger = require('@open-age/logger')('api.channelTypes')
const _ = require('underscore')
const db = require('../models')

exports.create = (req, res) => {
    let model = req.body

    if (!model.name) {
        return res.failure('name is required')
    }

    if (!model.category) {
        return res.failure('category is required')
    }

    if (!model.providerName) {
        return res.failure('providerName is required')
    }

    let data = {
        name: (model.name).toLowerCase(),
        category: (model.category).toLowerCase(),
        providerName: model.providerName,
        description: model.description,
        parameters: model.parameters,
        picUrl: model.picUrl || ''
    }

    db.channelType.findOrCreate({
        category: (model.category).toLowerCase(),
        name: {
            $regex: data.name || '',
            $options: 'ig'
        }
    }, data)
        .then(data => {
            if (!data.created) {
                logger.debug('channelType already exist')
            }
            return res.data(mapper.toModel(data.result))
        })
        .catch(err => res.failure(err))
}

exports.get = (req, res) => {
    let channelTypeId = req.params.id

    db.channelType.findById(channelTypeId)
        .then(channelType => {
            if (!channelType) {
                throw new Error('no channel type found')
            }

            return db.channel.findOne({
                organization: req.context.organization,
                type: channelType
            })
                .then(myChannel => {
                    if (!myChannel) {
                        return channelType
                    }

                    channelType.channel = myChannel
                    return channelType
                })
        })
        .then(channelType => res.data(mapper.toModel(channelType)))
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    let query = {}

    if (req.query.category) {
        query.category = (req.query.category).toLowerCase()
    }

    db.channelType.find(query)
        .then(channelTypes => {
            return db.channel.find({
                organization: req.context.organization,
                type: {
                    $in: _.pluck(channelTypes, '_id')
                }
            })
                .then(myChannels => {
                    for (var index = 0; index < channelTypes.length; index++) {
                        let channel = _.find(myChannels, item =>
                            item.type.toString() === channelTypes[index].id)

                        if (channel) {
                            channelTypes[index].channel = channel
                        }
                    }
                    return channelTypes
                })
        })
        .then(channelTypes => res.page(mapper.toSearchModel(channelTypes)))
        .catch(err => res.failure(err))
}
