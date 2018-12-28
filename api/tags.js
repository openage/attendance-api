'use strict'
const mapper = require('../mappers/tag')
const tagType = require('../services/tag-types')
const db = require('../models')

exports.create = (req, res) => {
    let tagTypeModel = {
        name: req.body.tagType.name,
        organization: req.context.organization
    }

    tagType.createOrFindTagType(tagTypeModel).then(tagType => {
        return db.tag.findOrCreate({
            name: req.body.name,
            tagType: tagType.result.id,
            status: 'active'
        }).then(tag => {
            return res.data(mapper.toModel(tag.result))
        })
    })
}

exports.get = (req, res) => {
    if (!req.params.id) {
        return res.failure('tag id is required')
    }
    db.tag.findOne({
        _id: req.params.id
    })
        .then(tags => {
            if (!tags) {
                return res.failure('no tags found')
            }
            return res.data(mapper.toModel(tags))
        })
}

exports.tagsByTagType = (req, res) => {
    if (!req.params.id) {
        return res.failure('tag Type is required')
    }
    db.tag.find({
        tagType: req.params.id
    })
        .then(tags => {
            if (!tags) {
                return res.failure('no tags found')
            }
            return res.page(mapper.toSearchModel(tags))
        })
}
