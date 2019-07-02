'use strict'
const mapper = require('../mappers/tagType')
const tagType = require('../services/tag-types')
const _ = require('underscore')
const db = require('../models')

exports.create = (req, res) => {
    let model = {
        name: req.body.name.toLowerCase(),
        organization: req.context.organization
    }

    tagType.createOrFindTagType(model).then(tagType => {
        return res.data(mapper.toModel(tagType.result))
    })
}

exports.get = (req, res) => {
    if (!req.params.id) {
        return res.failure('tag Type is required')
    }
    db.tagType.findOne({
        _id: req.params.id
    })
        .then(tagType => {
            if (!tagType) {
                return res.failure('no tags found')
            }
            return res.data(mapper.toModel(tagType))
        })
}

exports.search = (req, res) => {
    db.tag.aggregate([{
        $lookup: {
            from: 'tagtypes',
            localField: 'tagType',
            foreignField: '_id',
            as: 'tagType'
        }
    }, {
        $match: {
            'status': 'active',
            'tagType.organization': global.toObjectId(req.context.organization.id)
        }
    }, {
        $sort: {
            name: 1
        }
    }]).then((tags) => {
        if (!tags) {
            return res.failure('tagType not found')
        }
        let tagTypes = []
        let g = _.groupBy(tags, (i) => {
            return i.tagType[0]._id.toString()
        })
        _.each(g, (i) => {
            let tagType = i[0].tagType[0]
            tagType.tags = i
            tagTypes.push(tagType)
        })
        return res.page(mapper.toSearchModel(tagTypes))
    })
}
