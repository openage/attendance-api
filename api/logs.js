const moment = require('moment')
const db = require('../models')

const paging = require('../helpers/paging')

exports.search = async (req) => {
    let page = paging.extract(req)

    var whereQuery = {}

    if (req.query.timeStamp) {
        whereQuery.timeStamp = {
            $gte: moment(req.query.timeStamp).startOf('day'),
            $lt: moment(req.query.timeStamp).endOf('day')
        }
    }

    if (req.query.org !== 'system') {
        whereQuery.organization = req.context.organization
    }

    switch (req.query.level || 'all') {
    case 'all':
        whereQuery.level = {
            $regex: /info|error/,
            $options: 'i'
        }
        break
    case 'd': break
    default:
        whereQuery.level = {
            $regex: req.query.level,
            $options: 'i'
        }
        break
    }

    if (req.query.message) {
        whereQuery.message = {
            $regex: req.query.message,
            $options: 'i'
        }
    }

    if (req.query.location) {
        whereQuery.location = {
            $regex: req.query.location,
            $options: 'i'
        }
    }

    if (req.query.deviceId) {
        whereQuery.device = req.query.deviceId
    }

    if (req.query.userId) {
        whereQuery.user = req.query.userId
    }

    if (req.query.app) {
        whereQuery.app = req.query.app
    }

    let count = await db.log.find(whereQuery).count()

    let logs = await db.log.find(whereQuery)
        .populate('user device')
        .limit(page.limit)
        .skip(page.skip)
        .sort({ timeStamp: -1 })

    return {
        items: logs.map(item => {
            let model = {
                level: item.level,
                app: item.app,
                timeStamp: item.timeStamp,
                message: item.message,
                location: item.location,
                meta: item.meta
            }

            if (item.device && item.device._doc) {
                model.device = {
                    id: item.device.id,
                    name: item.device.name
                }
            }

            if (item.organization && item.organization._doc && req.query.org === 'system') {
                model.organization = {
                    id: item.organization.id,
                    code: item.organization.code
                }
            }
            if (item.employee && item.employee._doc) {
                model.employee = {
                    id: item.employee.id,
                    name: item.employee.name
                }
            }

            if (item.user && item.user._doc) {
                model.user = {
                    id: item.user.id,
                    code: item.user.code,
                    name: item.user.name
                }
            }

            return model
        }),
        total: count,
        pageSize: page.limit,
        pageNo: page.pageNo
    }
}
