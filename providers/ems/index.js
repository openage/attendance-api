'use strict'

const defaultConfig = require('config').get('providers.ems')
const logger = require('@open-age/logger')('providers.ems')
const client = new require('node-rest-client-promise').Client()
const _ = require('underscore')
var moment = require('moment')

let parsedConfig = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        organization: config.organization,
        url: config.url || defaultConfig.url,
        api_key: config.api_key,
        lastSyncDate: config.lastSyncDate
    }
}

const getEmployees = (config) => {
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'org-code': config.organization.code, // ems will have same org code as ams code
            'x-access-token': config.api_key // TODO: was ["external-token"];
        },
        parameters: {
            lastModifiedDate: config.lastSyncDate ? config.lastSyncDate.toISOString() : null
        }
    }

    logger.debug(`getting employees from '${config.url}' with lastModifiedDate '${args.parameters.lastModifiedDate}'`)
    return client.getPromise(config.url, args).then(response => response.data.items)
}

const formatDirectoryEmployee = (model) => {
    if (model.code === null || model.code === undefined) {
        return null
    }

    let entity = {
        EmpDb_Emp_id: model._id,
        code: model.code,
        // displayCode: model.displayCode, // ?
        dom: model.dom,
        dol: model.dol,
        doj: model.doj,

        designation: model.designation,
        department: model.department,
        division: model.division,

        email: model.email,
        phone: model.phone,
        status: model.status,

        isDynamicShift: model.isDynamicShift,
        shiftType: model.shiftType,

        userType: model.type || 'normal'
    }
    if (model.config && model.config.contractor && model.config.contractor.name) {
        entity.contractor = model.config.contractor.name
    } else {
        entity.contractor = ''
    }
    if (model.profile) {
        let profile = model.profile
        entity.name = `${profile.firstName} ${profile.lastName ? profile.lastName : ''}`
        entity.name.trimRight()

        entity.fatherName = profile.fatherName
        entity.dob = profile.dob
        entity.gender = profile.gender

        if (profile.pic) {
            entity.picUrl = profile.pic.url
            entity.picData = profile.pic.thumbnail
        }
    }
    entity.config = model.config || {}

    if (entity.config.biometricCode) {
        entity.biometricCode = entity.config.biometricCode
    }

    if (model.role) {
        entity.role = model.role
    }

    if (model.supervisor) {
        entity.supervisor = formatDirectoryEmployee(model.supervisor)
    } else {
        entity.supervisor = null
    }

    return entity
}

const formatEDEmployee = (emsModel) => {
    if (emsModel.code === null || emsModel.code === undefined) {
        return null
    }

    let formattedEmployee = {
        EmpDb_Emp_id: emsModel.id,
        name: emsModel.name,
        fatherName: emsModel.fatherName,
        code: emsModel.code,
        biometricCode: emsModel.biometricCode, // TODO: obsolete
        dob: emsModel.dob,
        dom: emsModel.dom,
        dol: emsModel.dol,
        doj: emsModel.doj,
        gender: emsModel.gender,
        contractor: emsModel.contractor,
        picUrl: emsModel.picUrl || null,
        picData: emsModel.picData || null,
        email: emsModel.email,
        phone: emsModel.phone,
        userType: emsModel.userType || 'normal',
        status: emsModel.status ? (emsModel.status === 'activate' ? 'active' : 'inactive') : 'active'
    }

    if (emsModel.designation && emsModel.designation.name) {
        formattedEmployee.designation = emsModel.designation.name
    } else {
        formattedEmployee.designation = emsModel.designation
    }
    if (emsModel.department && emsModel.department.name) {
        formattedEmployee.department = emsModel.department.name
    } else {
        formattedEmployee.department = emsModel.department
    }
    if (emsModel.division && emsModel.division.name) {
        formattedEmployee.division = emsModel.division.name
    } else {
        formattedEmployee.division = emsModel.division
    }

    if (emsModel.supervisor) {
        formattedEmployee.supervisor = formatEDEmployee(emsModel.supervisor)
    } else {
        formattedEmployee.supervisor = null
    }

    // if (formattedEmployee.status === 'inactive') {
    //     formattedEmployee.deactivationDate = moment().endOf('day').toDate()
    // }

    return formattedEmployee
}

/**
 * fetches employees from ems
 * @param fromDate - the date since when the employees have changed
 * @param config - ems config of that org
 * @returns employees
 */
exports.fetch = (config) => {
    return getEmployees(parsedConfig(config)).then(employees => {
        logger.debug(`received '${employees.length}' employee(s)`)
        return _(employees).map((emp) => {
            if (emp._id) {
                return formatDirectoryEmployee(emp)
            } else {
                return formatEDEmployee(emp)
            }
        })
    })
}

/**
 * creates and updates the employee changes to ems
 * @param changes list of employees grouped by created and updated
 * @param config - ems config of that org
 * @returns status of call
 */
exports.push = (changes, config) => {
    // TODO: implement this
}

exports.reform = formatDirectoryEmployee

exports.reformV4 = formatEDEmployee
