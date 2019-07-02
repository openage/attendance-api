const db = require('../models')
const offline = require('@open-age/offline-processor')

const set = (entity, model) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.category) {
        entity.category = model.category
    }
    if (model.unitsPerDay !== undefined) {
        entity.unitsPerDay = model.unitsPerDay
    }

    if (model.unlimited !== undefined) {
        entity.unlimited = model.unlimited
    }

    if (model.carryForward !== undefined) {
        entity.carryForward = model.carryForward
    }

    if (model.monthlyLimit !== undefined) {
        entity.monthlyLimit = model.monthlyLimit
    }

    if (model.periodicity) {
        entity.periodicity = entity.periodicity || {}

        if (model.periodicity.value) {
            entity.periodicity.value = model.periodicity.value
        }

        if (model.periodicity.type) {
            entity.periodicity.type = model.periodicity.type
        }
    }

    if (model.days !== undefined) {
        entity.credit = model.days * entity.unitsPerDay
    }

    return entity
}

exports.get = async (query, context) => {
    context.logger.start('services/leave-types:find')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.leaveType.findById(query)
        } else {
            return (db.leaveType.findOne({
                code: {
                    $regex: '^' + query + '$', // leaveType name
                    $options: 'i'
                },
                organization: context.organization
            }))
        }
    }

    if (query.id) {
        return db.leaveType.findById(query.id)
    }
    if (query.code) {
        return (db.leaveType.findOne({
            code: {
                $regex: '^' + query.code + '$', // leaveType name
                $options: 'i'
            },
            organization: context.organization
        }))
    }

    if (query.name) {
        return (db.leaveType.findOne({
            name: {
                $regex: '^' + query.name + '$', // leaveType name
                $options: 'i'
            },
            organization: context.organization
        }))
    }

    return null
}

exports.create = async (model, context) => {
    model.code = model.code.toLowerCase()
    let entity = await db.leaveType.findOne({
        code: model.code,
        organization: context.organization.id
    })

    if (entity) {
        throw new Error(`code '${model.code}' already exists`)
    }

    model.periodicity = model.periodicity || model.trigger || {}
    model.periodicity.type = model.periodicity.type || 'manual'

    let leaveType = new db.leaveType({
        organization: context.organization
    })

    set(leaveType, model)

    await leaveType.save()
    await offline.queue('leave-type', 'create', leaveType, context)

    return leaveType
}

exports.update = async (id, model, context) => {
    model.periodicity = model.periodicity || model.trigger || {}

    const leaveType = await db.leaveType.findById(id)

    if (model.code && leaveType.code !== model.code) {
        model.code = model.code.toLowerCase()
        let entity = await db.leaveType.findOne({
            code: model.code,
            organization: context.organization.id
        })

        if (entity) {
            throw new Error(`code '${model.code}' already exists`)
        }

        leaveType.code = model.code
    }

    set(leaveType, model)

    await leaveType.save()
    await offline.queue('leave-type', 'update', leaveType, context)

    return leaveType
}

const search = async (query, context) => {
    let where = {
        organization: context.organization
    }

    if (query.skipCodes && query.skipCodes.length) {
        where.code = {
            $nin: query.skipCodes
        }
    }

    let leaveTypes = await db.leaveType.find(where)
    return leaveTypes
}

exports.delete = async (id, context) => {
    await db.leaveBalance.remove({
        leaveType: id
    })
    await db.leave.remove({
        leaveType: id
    })
    await db.leaveType.remove({
        _id: id
    })
}
exports.search = search
