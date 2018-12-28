const db = require('../models')
exports.get = async (query, context) => {
    context.logger.start('services/leave-types:find')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.leaveType.findById(query)
        } else {
            return (await db.leaveType.findOrCreate({
                code: {
                    $regex: query, // leaveType name
                    $options: 'i'
                },
                organization: context.organization
            }, {
                code: query,
                name: query,
                organization: context.organization,
                unitsPerDay: 0
            })).result
        }
    }

    if (query.id) {
        return db.leaveType.findById(query.id)
    }

    if (query.code) {
        return (await db.leaveType.findOrCreate({
            code: {
                $regex: query.code, // leaveType name
                $options: 'i'
            },
            organization: context.organization
        }, {
            code: query.code,
            name: query.code,
            organization: context.organization,
            unitsPerDay: 0
        })).result
    }

    if (query.name) {
        return (await db.leaveType.findOrCreate({
            name: {
                $regex: query.name, // leaveType name
                $options: 'i'
            },
            organization: context.organization
        }, {
            code: query.name,
            name: query.name,
            organization: context.organization,
            unitsPerDay: 0
        })).result
    }

    return null
}
