'use strict'

exports.query = (req) => {
    let query = req.query || {}
    let model = {}

    Object.getOwnPropertyNames(query).forEach(key => {
        const value = query[key]

        if (!value) {
            return
        }

        let parts = key.split('-')
        let index = 0
        let obj = model

        for (const part of parts) {
            if (index === parts.length - 1) {
                obj[part] = value
            } else {
                obj[part] = obj[part] || {}
            }

            obj = obj[part]
            index++
        }
    })

    return model
}
exports.extract = req => {
    let serverPaging = req.query.serverPaging

    if (serverPaging === undefined) {
        if (req.query.pageNo !== undefined || req.query.pageSize !== undefined || req.query.limit !== undefined) {
            serverPaging = true
        }
    } else {
        serverPaging = serverPaging === 'true' ? true : serverPaging
    }

    if (req.query.noPaging !== undefined) {
        req.query.noPaging = req.query.noPaging === 'false' ? false : req.query.noPaging
    }
    if (!serverPaging || req.query.noPaging) {
        return null
    }

    let limit = 10
    if (req.query.pageSize) {
        limit = Number(req.query.pageSize)
    }
    if (req.query.limit) {
        limit = Number(req.query.limit)
    }

    let offset = 0
    let pageNo = 1
    if (req.query.offset !== undefined) {
        offset = Number(req.query.offset)
        pageNo = Math.floor(offset / limit) + 1
    } else if (req.query.pageNo !== undefined) {
        pageNo = Number(req.query.pageNo)
        offset = limit * (pageNo - 1)
    }

    return {
        pageNo: pageNo,
        limit: limit,
        skip: offset
    }
}
