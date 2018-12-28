'use strict'
const mapper = require('../mappers/category')
const db = require('../models')

exports.create = (req, res) => {
    let model = req.body

    if (!model.name) {
        return res.failure('name is required')
    }

    let data = {
        name: model.name
    }

    db.category.findOrCreate({ name: { $regex: data.name, $options: 'i' } }, data)
        .then(category => {
            return res.data(mapper.toModel(category.result))
        })
        .catch(err => res.failure(err))
}

exports.search = (req, res) => {
    db.category.find({}).populate({ path: 'machines', match: { status: { $ne: 'inactive' } } })
        .then(categories => {
            return res.page(mapper.toSearchModel(categories))
        })
        .catch(err => res.failure(err))
}
