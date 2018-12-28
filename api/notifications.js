'use strict'
const mapper = require('../mappers/notification')
const _ = require('underscore')
const moment = require('moment')
const db = require('../models')

exports.search = function (req, res) {
    let PageNo = Number(req.query.pageNo)
    let toPage = (PageNo || 1) * 10
    let fromPage = toPage - 10
    let pageLmt = 10
    let employeeId
    let query = {}
    let archiveQuery = {}
    employeeId = req.query.employee
        ? (req.query.employee === 'my'
            ? global.toObjectId(req.employee.id) : global.toObjectId(req.query.employee))
        : global.toObjectId(req.employee.id)

    if (req.query.status && req.query.status.toLowerCase() === 'archive') {
        query = {
            'notifications.status': 'seen'
        }
        query['notification_doc.date'] = { $lte: req.query.date ? moment(req.query.date).endOf('day')._d : moment().endOf('day')._d }
        archiveQuery = {
            $match: {
                'notification.status': 'archive'
            }
        }
    } else {
        query = {
            'notifications.status': 'new'
        }
        query['notification_doc.date'] = { $lte: req.query.date ? moment(req.query.date).endOf('day')._d : moment().endOf('day')._d }
        archiveQuery = {
            $match: {
                'notification.status': { $ne: 'archive' }
            }
        }
    }

    db.employee.aggregate([{
        $match: {
            _id: employeeId
        }
    },
    {
        $unwind: '$notifications'
    },
    {
        $lookup: {
            from: 'notifications',
            localField: 'notifications.notification',
            foreignField: '_id',
            as: 'notification_doc'
        }
    },
    {
        $match: query
    },
    {
        $project: {
            notification: { $arrayElemAt: ['$notification_doc', 0] },
            '_id': '$notifications._id',
            'status': '$notifications.status',
            'priority': '$notifications.priority'
        }
    },
    archiveQuery,
    { $skip: fromPage },
    { $limit: pageLmt },
    { $sort: { date: -1 } }
    ]).then(notifications => {
        if (_.isEmpty(notifications)) {
            console.log('no notifications found')
        }

        let items = _.chain(notifications)
            .each(item => item.notification.priority = item.priority)
            .pluck('notification')

        res.page(mapper.toSearchModel(items), notifications.length, PageNo)
    }).catch(err => res.failure(err))
}

exports.archive = function (req, res) {
    let notificationId = req.params.id

    Promise.all([
        db.notification.findById(notificationId),
        new Promise((resolve, reject) => {
            if (req.params.employee === 'my') {
                return resolve(req.employee)
            }
            return db.employee.findById(req.params.employee)
                .then(employee => {
                    return resolve(employee)
                })
        })
    ])

        .spread((notification, employee) => {
            if (!notification) {
                throw new Error('no notification found to archive')
            }

            let employeeNotification = _.find(employee.notifications, item => {
                if (item.notification.toString() === notificationId) {
                    return item
                }
            })

            if (!employeeNotification) {
                throw new Error('no notification found to archive in employee')
            }

            notification.status = 'archive'
            employeeNotification.status = 'seen'
            return Promise.all([
                notification.save(),
                employee.save()
            ])
                .then(() => {
                    return res.success('notification archived')
                })
        })
        .catch(err => {
            res.failure(err)
        })
}

exports.delete = (req, res) => {
    if (!req.body.date) {
        return res.failure('enter date')
    }
    var deleteDate = moment(req.body.date).format('YYYY-MM-DD')

    db.notification.remove({
        date: {
            $lt: deleteDate
        }
    })
        .then(notification => {
            res.success('notification successfully deleted')
        })
}
