'use strict'
const users = require('../services/employees')

const toEntity = (directoryModel) => {
    if (directoryModel.code === null || directoryModel.code === undefined) {
        return null
    }

    let entity = {
        tackingId: directoryModel._id,
        code: directoryModel.code,
        // displayCode: model.displayCode, // ?
        dom: directoryModel.dom,
        dol: directoryModel.dol,
        doj: directoryModel.doj,

        profile: directoryModel.profile,

        designation: directoryModel.designation,
        department: directoryModel.department,
        division: directoryModel.division,

        email: directoryModel.email,
        phone: directoryModel.phone,
        status: directoryModel.status,

        isDynamicShift: directoryModel.isDynamicShift,
        shiftType: directoryModel.shiftType,

        userType: directoryModel.type || 'normal'
    }

    if (directoryModel.config && directoryModel.config.contractor && directoryModel.config.contractor.name) {
        entity.contractor = directoryModel.config.contractor.name
    } else {
        entity.contractor = ''
    }

    entity.config = directoryModel.config || {}

    if (entity.config.biometricCode) {
        entity.biometricCode = entity.config.biometricCode
    }

    if (directoryModel.role) {
        entity.role = directoryModel.role
    }

    if (directoryModel.supervisor) {
        entity.supervisor = toEntity(directoryModel.supervisor)
    } else {
        entity.supervisor = null
    }

    return entity
}

exports.create = async (req) => {
    let model = toEntity(req.body, req.context)
    await users.create(model, req.context)
    return 'user created'
}

exports.update = async (req) => {
    let model = toEntity(req.body, req.context)
    await users.create(model, req.context)
    return 'user updated'
}
