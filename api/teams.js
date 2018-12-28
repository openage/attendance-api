'use strict'
const mapper = require('../mappers/team')
const empMapper = require('../mappers/employee')
const moment = require('moment')
const _ = require('underscore')
const db = require('../models')

exports.getMyTeam = (req, res) => {
    let fromDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d
        : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0)._d

    let toDate = req.query.date ? moment(req.query.date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
        : moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')._d
    let PageNo = Number(req.query.pageNo)
    let pageSize = Number(req.query.pageSize)
    let toPage = (PageNo || 1) * (pageSize || 10)
    let fromPage = toPage - (pageSize || 10)
    let pageLmt = (pageSize || 10)

    let supervisor
    if (req.params.id === 'my') {
        supervisor = req.employee.id.toString()
    } else {
        supervisor = req.params.id
    }

    Promise.all([
        db.employee.find({
            $or: [{
                supervisor: supervisor,
                status: 'active'
            }, {
                supervisor: supervisor,
                status: 'inactive',
                deactivationDate: {
                    $gte: moment().toDate()
                }
            }]

        }).count(),
        db.employee.find({
            $or: [{
                supervisor: supervisor,
                status: 'active'
            }, {
                supervisor: supervisor,
                status: 'inactive',
                deactivationDate: {
                    $gte: moment().toDate()
                }
            }]

        })
            .skip(fromPage).limit(pageLmt)

    ])
        .spread((totalCount, data) => {
            return Promise.mapSeries(data, teamMember => {
                return db.employee.findById(teamMember.id.toString())
                    .populate('shiftType supervisor')
                    .then((employee) => {
                        return db.attendance.findOne({
                            employee: teamMember.id.toString(),
                            ofDate: {
                                $gte: fromDate,
                                $lt: toDate
                            }
                        })
                            .populate('recentMostTimeLog')
                            .then(attendance => {
                                if (employee) {
                                    employee.attendance = attendance
                                    employee.today = !req.query.date
                                    return employee
                                }
                            })
                    })
            })
                .then((team) => {
                    res.page(empMapper.toSearchModel(team), pageSize, PageNo, totalCount)
                })
                .catch(err => res.failure(err))
        })
}
