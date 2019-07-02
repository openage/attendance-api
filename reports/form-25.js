'use strict'
const formatter = require('../formatters/form-25')
const monthlySummaryService = require('../services/monthly-summaries')

module.exports = async (params, context) => {
    let ofDate = params.dates && params.dates.from ? params.dates.from : new Date()
    let fileName = `${context.reportRequest.type}-${context.reportRequest.id}.xlsx`
    let monthlysummary = await monthlySummaryService.search(params, {
        columns: []
    }, context)
    let monthlySummaryIds = monthlysummary.items

    await formatter.build(fileName, ofDate, monthlySummaryIds, context)

    return Promise.resolve({
        fileName: fileName
    })
}
