'use strict'
const _ = require('underscore')
const db = require('../models')

exports.search = async (query, context) => {
    context.logger.start('search')
    let projection = {
        date: 1,
        _id: 0
    }

    if (query['my.insight']) {
        projection['my.$.insight'] = 1
    }

    if (query['team.insight']) {
        projection['team.$.insight'] = 1
    }

    return db.insightSummary.find(query, projection).lean().populate('my.insight')
}

exports.groupByInsightKey = async (insightSummaries, type, context) => {
    context.logger.start('addDayWithValue')
    insightSummaries.forEach(valueOfInsightSummary => {
        valueOfInsightSummary[type].forEach((keyValuesForInsight) => {
            let subGroupedArray = _.groupBy(keyValuesForInsight.values, (value) => {
                value.date = valueOfInsightSummary.date
                return value.key
            })
            keyValuesForInsight.values = subGroupedArray
        })
    })
    return _.pluck(insightSummaries, type)
}

exports.mappedInsightKeyValues = async (insightSummaries, context) => {
    context.logger.start('mappedInsightKeyValues')

    let items = []
    const finalArray = []

    for (let entity of insightSummaries) {
        if (entity.length && entity[0].values) {
            let values = entity[0].values
            for (let value in values) {
                let label = []
                let data = []
                label.push(values[value][0].date)
                data.push(values[value][0].value)
                items.push({
                    label: label,
                    data: data,
                    name: value
                })
            }
        }
    }
    let groupedArray = _.groupBy(items, 'name')

    for (let groupName in groupedArray) {
        let finalObject = {
            key: groupName,
            label: [],
            data: []
        }
        groupedArray[groupName].forEach((item) => {
            finalObject.label.push([...item.label])
            finalObject.data.push([...item.data])
        })
        finalObject.label = [].concat(...finalObject.label)
        finalObject.data = [].concat(...finalObject.data)
        finalArray.push(finalObject)
    }
    return finalArray
}
