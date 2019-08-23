const db = require('../models')
const taskService = require('./tasks')

exports.create = async (model, context) => {
    const log = context.logger.start('create')

    let user = await db.employee.findById(model.user.id)
    const device = await db.device.findById(model.device.id)
    let entity = await db.biometric.findOne({
        device: device,
        user: user,
        organization: context.organization
    }).populate('device')

    if (!entity) {
        if (!model.code) {
            model.code = user.biometricCode
        }
        entity = new db.biometric({
            device: device,
            user: model.user.id,
            organization: context.organization
        })
        await entity.save()
    }

    if (!model.status) {
        model.status = 'enabled'
    }

    await set(entity, model, context)
    await entity.save()

    log.end()

    return entity
}

exports.get = async (query, context) => {
    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return db.biometric.findById(query).populate('device').populate({
            path: 'user',
            populate: {
                path: 'shiftType'
            }
        })
    }
    if (query.id) {
        return db.biometric.findById(query.id).populate('device').populate({
            path: 'user',
            populate: {
                path: 'shiftType'
            }
        })
    }

    if (query.code && query.device) {
        return db.biometric.findOne({
            code: query.code,
            device: query.device,
            status: {
                $in: ['enabled', 'fetching']
            }
        }).populate('device').populate({
            path: 'user',
            populate: {
                path: 'shiftType'
            }
        })
    }

    if (query.user && query.device) {
        return db.biometric.findOne({
            user: query.user,
            device: query.device
        }).populate('device').populate({
            path: 'user',
            populate: {
                path: 'shiftType'
            }
        })
    }

    return null
}

exports.search = async (query, paging, context) => {
    const log = context.logger.start('query')
    let where = {
        organization: context.organization
    }

    if (query.userId || query.user) {
        where.user = query.userId || query.user.id
    } else if (query.userCode) {
        where.user = await db.employee.findOne({
            code: query.userCode,
            organization: context.organization
        })
    } else if (query.userStatus && query.userStatus === 'temp') {
        let users = await db.employee.find({
            status: 'temp',
            organization: context.organization
        })
        where.user = {
            $in: users
        }
    }

    if (query.deviceId || query.device) {
        where.device = query.deviceId || query.device.id || query.device._id
    }

    if (query.code) {
        where.code = query.code
    }

    if (query.status) {
        where.status = query.status
    }

    let page = {
        pageNo: 1
    }

    if (paging && paging.limit) {
        page.items = await db.biometric.find(where).sort({
            'timeStamp': -1
        }).skip(paging.skip).limit(paging.limit).populate('device user')
        page.pageSize = paging.limit
        page.pageNo = paging.pageNo
        page.total = await db.biometric.find(where).count()
    } else {
        page.items = await db.biometric.find(where).sort({
            'timeStamp': -1
        }).populate('device user')
        page.total = page.items.length
    }

    log.end()

    return page
}

exports.updateCode = async (user, newCode, context) => {
    const items = await db.biometric.find({
        organization: context.organization,
        user: user
    }).populate('device')

    for (const item of items) {
        await takeAction(item, 'remove', {
            multiple: true
        }, context)
        item.code = newCode
        await item.save()

        switch (item.status) {
        case 'enabled':
            await takeAction(item, 'enable', {
                multiple: true
            }, context)
            break
        case 'disabled':
            await takeAction(item, 'enable', {
                multiple: true
            }, context)
            await takeAction(item, 'disable', {
                multiple: true
            }, context)
            break
        }
    }
}

exports.remove = async (user, context) => {
    const items = await db.biometric.find({
        organization: context.organization,
        user: user
    }).populate('device')

    for (const item of items) {
        await set(item, {
            status: 'disabled'
        }, context)

        await item.save()
    }
}

exports.update = async (id, model, context) => {
    const log = context.logger.start('update')

    if (model.status) {
        model.status = model.status.toLowerCase()
    }

    let entity = await db.biometric.findById(id).populate('device user')
    if (!entity.code && !model.code) {
        entity.code = entity.user.biometricCode
    }
    await set(entity, model, context)
    await entity.save()

    log.end()
    return entity
}

const set = async (entity, model, context) => {
    if (model.marks && model.marks.length) {
        entity.marks = model.marks
        entity.status = 'enabled'

        let others = await db.biometric.find({
            user: entity.user,
            organization: context.organization,
            _id: {
                $ne: entity.id
            }
        })

        if (others && others.length) {
            for (const item of others) {
                if (item.status === 'deleted' || item.id === entity.id) {
                    break
                }
                item.marks = model.marks

                await item.save()
                if (item.status === 'enabled') {
                    await takeAction(item, 'enable', {}, context)
                }
            }
        }
    }

    if (model.code) {
        entity.code = model.code
    }

    if (model.status && (model.status !== entity.status || model.status === 'fetching')) {
        entity.status = model.status

        if (model.status === 'enabled') {
            await enable(entity, context)
        } else if (model.status === 'disabled') {
            await takeAction(entity, 'disable', {}, context)
        } else if (model.status === 'deleted') {
            entity.marks = []
            await takeAction(entity, 'remove', {}, context)
        } else if (model.status === 'fetching') {
            await fetch(entity, context)
        }
    }
    return entity
}

const fetch = async (entity, context) => {
    entity.marks = []

    let biometrics = await db.biometric.find({
        user: entity.user,
        _id: {
            $ne: entity.id
        },
        organization: context.organization
    })

    for (const biometric of biometrics) {
        biometric.marks = []
        await biometric.save()
    }

    await takeAction(entity, 'fetch', {}, context)
}

const enable = async (entity, context) => {
    if (entity.marks && entity.marks.length) {
        return takeAction(entity, 'enable', {}, context)
    }

    let existing = await db.biometric.findOne({
        user: entity.user,
        'marks.0': {
            $exists: true
        },
        organization: context.organization
    })

    if (existing) {
        entity.marks = existing.marks
        await entity.save()
        await takeAction(entity, 'enable', {}, context)
    } else {
        await takeAction(entity, 'fetch', {}, context)
    }
}

const takeAction = async (biometric, action, options, context) => {
    const log = context.logger.start(`services/biometrics:action:${action}`)

    if (!biometric.code) {
        throw new Error(`Employee: ${biometric.user.code} does not have biometric code`)
    }

    options = options || {}

    if (!options.multiple) {
        action = action.toLowerCase()
        let where = {
            status: 'new',
            'employee.id': biometric.user,
            assignedTo: 'sync-service'
        }

        // should fetch from only one m/c - cancel other fetches
        switch (action) {
        case 'fetch':
            where.action = 'fetch'
            break
        case 'enable':
            where.device = biometric.device
            // where.action = { $in: ['remove', 'disable'] }
            break
        case 'disable':
            where.device = biometric.device
            // where.action = { $in: ['enable', 'fetch', 'remove'] }
            break
        case 'remove':
            where.device = biometric.device
            // where.action = { $in: ['enable', 'fetch', 'disable'] }
            break
        }

        let tasksToCancel = await taskService.search(where, context)

        if (action === 'fetch' && tasksToCancel && tasksToCancel.length) {
            return
        }
        for (const item of tasksToCancel) {
            item.status = 'canceled'
            item.error = 'another task is created'
            await item.save()
        }
    }
    await taskService.create({
        employee: {
            id: biometric.user,
            code: biometric.code
        },
        data: biometric.id,
        device: biometric.device,
        entity: 'biometric',
        action: action,
        assignedTo: 'sync-service'
    }, context)

    log.end()
}
