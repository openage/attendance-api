'use strict'
const mapper = require('../mappers/machine')
const db = require('../models')

exports.create = (req, res) => {
    let model = req.body

    if (!model.model || !model.manufacturer || !model.category) {
        return res.failure('model and manufacturer and category is required')
    }

    let data = {
        manufacturer: model.manufacturer,
        model: model.model,
        category: model.category,
        picUrl: model.picUrl,
        picData: model.picData
    }

    db.machine.findOrCreate({
        manufacturer: data.manufacturer,
        model: data.model,
        category: data.category
    }, data)
        .then(machine => {
            res.data(mapper.toModel(machine.result))
            return machine.result
        })
        .then(machine => {
            return db.category.findOneAndUpdate({
                _id: machine.category
            }, { $addToSet: { machines: machine } })
        })
        .catch(err => res.failure(err))
}

// exports.search = (req, res) => {

//     db.machine.find({})
//         .then(categories => {
//             return res.page(mapper.toSearchModel(categories));
//         })
//         .catch(err => res.failure(err));
// };
