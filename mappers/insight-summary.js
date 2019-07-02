'use strict'
const _ = require('underscore')

exports.toModel = (entity) => {
    let model = {
        date: entity.date,
        type: entity.type,
        my: [],
        team: []
    }

    model.employee = {}

    if (entity.employee._doc) {
        model.employee = {
            id: entity.employee.id
        }
    } else {
        model.employee = {
            id: entity.employee
        }
    }

    if (entity.my && entity.my.length) {
        model.my = entity.my.map((myInsight) => {
            return {
                insight: myInsight.insight,
                notes: myInsight.notes,
                values: myInsight.values && myInsight.values.length ? myInsight.values.map((values) => { return { key: values.key, value: values.value} }) : myInsight.value
            }
        })
    }

    if (entity.team && entity.team.length) {
        model.team = entity.team.map((teamInsight) => {
            return {
                insight: teamInsight.insight,
                notes: teamInsight.notes,
                values: teamInsight.values && teamInsight.values.length ? teamInsight.values.map((values) => { return {key: values.key, value: values.value} }) : teamInsight.value
            }
        })
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
