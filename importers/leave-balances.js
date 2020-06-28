/* eslint-disable indent */
const moment = require('moment')
const dates = require('../helpers/dates')

const columnMaps = {
    default: [{
        key: 'code',
        label: 'Employee Code'
    }, {
        key: 'cl',
        label: 'CL'
    }, {
        key: 'co',
        label: 'Compensatory Off'
    },
    {
        key: 'od',
        label: 'On Duty'
    }
        , {
        key: 'el',
        label: 'Earned Leave'
    }, {
        key: 'ml',
        label: 'Medical Leave'
    }, {
        key: 'lt',
        label: 'Local Tour'
    }, {
        key: 'lws',
        label: 'Leave Without Pay'
    }, {
        key: 'reason',
        label: 'Reason'
    }]
}

exports.config = async (req, options) => {
    let format = options.format || 'default'

    if (!columnMaps[format]) {
        throw new Error(`'${format}' is not supported`)
    }
    return {
        sheet: 'Leave Balance',
        timeZone: req.context.config.timeZone,
        columnMap: columnMaps[format],
        modelMap: (row) => {
            let model = {}
            if (!row.code) {
                throw new Error('Employee Code is required')
            }

            if (row.code) {
                model.employee = {
                    code: row.code
                }
            }

            model.leaveCodes = []

            if (row.cl) {
                model.leaveCodes.push({
                    key: 'cl',
                    value: row.cl
                })
            }

            if (row.od) {
                model.leaveCodes.push({
                    key: 'od',
                    value: row.od
                })
            }

            if (row.co) {
                model.leaveCodes.push({
                    key: 'co',
                    value: row.co
                })
            }

            if (row.el) {
                model.leaveCodes.push({
                    key: 'el',
                    value: row.el
                })
            }

            if (row.ml) {
                model.leaveCodes.push({
                    key: 'ml',
                    value: row.ml
                })
            }

            if (row.lt) {
                model.leaveCodes.push({
                    key: 'lt',
                    value: row.lt
                })
            }

            if (row.lws) {
                model.leaveCodes.push({
                    key: 'lws',
                    value: row.lws
                })
            }

            if (row.reason) {
                model.reason = row.reason
            }

            return model
        },
        headerRow: 0,
        keyCol: 0
    }
}
