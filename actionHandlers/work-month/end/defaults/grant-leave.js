const leaveBalanceService = require('../../../../services/leave-balances')
const db = require('../../../../models')
const moment = require('moment')

exports.process = async (data, context) => {
    await leaveBalanceService.runPeriodRule({
        type: 'monthly',
        value: 'end'
    }, {
        type: 'month',
        id: moment(data.date).format('MM-YYYY')
    }, context)
}
