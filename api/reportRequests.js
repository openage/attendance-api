'use strict'
const mapper = require('../mappers/reportRequest')
const reportRequests = require('../services/reportRequests')
const pager = require('../helpers/paging')

exports.create = async (req) => {
    const reportRequest = await reportRequests.create(req.body, req.context)

    return mapper.toModel(reportRequest)
}

exports.get = async (req) => {
    const reportRequest = await reportRequests.get(req.params.id, req.context)

    return mapper.toModel(reportRequest)
}

exports.search = async (req, res) => {
    let page = pager.extract(req)

    const reportRequestList = await reportRequests.search(req.query, page.skip, page.limit, req.context)

    return res.page(mapper.toSearchModel(reportRequestList.items), page.limit, page.pageNo, reportRequestList.count)
}
