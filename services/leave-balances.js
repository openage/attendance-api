const db = require('../models')
exports.get = async (query, context) => {
    context.logger.start('services/leave-balances:get')

    if (typeof query === 'string' && query.isObjectId()) {
        return db.leaveBalance.findById(query)
    }

    if (query.id) {
        return db.leaveBalance.findById(query.id)
    }

    if (query.employee && query.leaveType) {
        let balance = (await db.leaveBalance.findOrCreate({
            leaveType: query.leaveType,
            employee: query.employee
        }, {
            leaveType: query.leaveType,
            employee: query.employee,
            units: 0,
            unitsAvailed: 0
        })).result

        balance.leaveType = query.leaveType

        return balance
    }
    return null
}
