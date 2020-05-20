const db = require('../models')
const offline = require('@open-age/offline-processor')

const set = async (entity, model, context) => {
    if (model.code && entity.code !== model.code) {
        let exists = await this.get(model.code, context)

        if (exists) {
            throw new Error(`code '${model.code}' already exists`)
        }
        entity.code = model.code.toLowerCase()
    }

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

    let trigger = model.periodicity || model.trigger
    if (trigger) {
        entity.periodicity = entity.periodicity || {}

        if (trigger.value) {
            entity.periodicity.value = trigger.value
        }

        if (trigger.type) {
            entity.periodicity.type = trigger.type
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
                code: query.toLowerCase(),
                organization: context.organization
            }))
        }
    }

    if (query.id) {
        return db.leaveType.findById(query.id)
    }
    if (query.code) {
        return db.leaveType.findOne({
            code: query.code.toLowerCase(),
            organization: context.organization
        })
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
    let entity = await this.get(model.code, context)
    if (entity) {
        throw new Error(`code '${model.code}' already exists`)
    }

    model.periodicity = model.periodicity || model.trigger || {}
    model.periodicity.type = model.periodicity.type || 'manual'

    let leaveType = new db.leaveType({
        organization: context.organization,
        tenant: context.tenant
    })

    await set(leaveType, model, context)
    await leaveType.save()
    await offline.queue('leave-type', 'create', leaveType, context)

    return leaveType
}

exports.update = async (id, model, context) => {
    const leaveType = await db.leaveType.findById(id)
    await set(leaveType, model, context)
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
