/* eslint-disable indent */
const moment = require('moment')
const dates = require('../helpers/dates')

const columnMaps = {
    default: [{
        key: 'code',
        label: 'Employee Code'
    }, {
        key: 'leave',
        label: 'Leave Code'
    }, {
        key: 'date',
        label: 'From Date',
        type: Date
    }, {
        key: 'start',
        label: 'Half (F/S)'
    }, {
        key: 'toDate',
        label: 'To Date',
        type: Date
    }, {
        key: 'end',
        label: 'Half.(F/S)'
    }, {
        key: 'days',
        label: 'Days'
    }, {
        key: 'reason',
        label: 'Reason'
    }, {
        key: 'status',
        label: 'Status'
    }]
}

exports.config = async (req, options) => {
    let format = options.format || 'default'

    if (!columnMaps[format]) {
        throw new Error(`'${format}' is not supported`)
    }
    return {
        sheet: 'Leaves',
        timeZone: req.context.config.timeZone,
        columnMap: columnMaps[format],
        modelMap: (row) => {
            let model = {}
            if (!row.code) {
                throw new Error('Employee Code is required')
            }

            if (!row.leave) {
                throw new Error('Leave Code is required')
            }

            if (!row.date) {
                throw new Error('Date is required')
            }

            if (!row.days && !row.toDate && !row.start) {
                throw new Error(`Must specify one of the following. 'Days', 'Half', 'To Date'`)
            }

            if (row.end && !row.toDate) {
                throw new Error('To Date is required')
            }

            if (row.code) {
                model.employee = {
                    code: row.code
                }
            }
            if (row.leave) {
                model.type = {
                    code: row.leave
                }
            }

            if (row.days) {
                model.days = row.days
            }

            if (row.date) {
                model.date = moment(row.date).toDate()
            }

            if (row.toDate) {
                model.toDate = moment(row.toDate).toDate()
            }

            if (model.date && model.toDate && model.toDate < model.date) {
                throw new Error('To Date needs to be after From Date')
            }

            model.start = {
                first: true,
                second: true
            }

            if (row.start) {
                switch (row.start.toLowerCase()) {
                    case 'f':

                        if (!model.toDate) {
                            model.start.second = false
                        }
                        break

                    case 's':
                        model.start.first = false
                        break
                }
            }

            if (row.end) {
                model.end = {
                    first: true,
                    second: true
                }

                switch (row.end.toLowerCase()) {
                    case 'f':
                        model.end.second = false
                        break
                }
            }

            if (row.reason) {
                model.reason = row.reason
            }

            if (row.status) {
                model.status = (row.status || 'approved').toLowerCase()
            }
            return model
        },
        headerRow: 0,
        keyCol: 0
    }
}
