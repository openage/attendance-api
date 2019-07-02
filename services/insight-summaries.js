'use strict'
const db = require('../models')
const set = (model, entity, context) => {
    if (model.my && model.my.length) {
        model.my.forEach(insightModel => {
            let insight = entity.my.find((myinsight) => {
                return myinsight.insight.toString() === insightModel.insight.id
            })
            if (!insight) {
                insight = {
                    insight: insightModel.insight.id,
                    values: insightModel.values,
                    notes: insightModel.notes
                }
                entity.my.push(insight)
            }
            insight.value = insightModel.value
            insight.notes = insightModel.notes
        })
    }

    if (model.team && model.team.length) {
        entity.team = model.team
    }
}

exports.create = async (model, context) => {
    const log = context.logger.start('services:create')

    return await new db.insightSummary(model).save()
}

exports.search = async (query, context) => {
    const log = context.logger.start('search')

    return await db.insightSummary.find(query)
}

exports.get = async (id, context) => {
    const log = context.logger.start('get')

    return await db.insightSummary.findById(id)
}

exports.update = async (id, model, context) => {
    const log = context.logger.start('update')

    let entity = await db.insightSummary.findById(id)

    set(model, entity, context)

    return await entity.save()
}

exports.findOrCreate = async (query, model, context) => {
    const log = context.logger.start('findOrCreate')

    return (await db.insightSummary.findOrCreate(query, model, { upsert: true })).result
}
