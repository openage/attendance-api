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

const formatEmployee = (emsModel) => {
    if (emsModel.code === null || emsModel.code === undefined) {
        return null
    }

    let formattedEmployee = {
        EmpDb_Emp_id: emsModel.id,
        name: emsModel.name,
        fatherName: emsModel.fatherName,
        code: emsModel.code,
        displayCode: emsModel.displayCode,
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
        formatEmployee.designation = emsModel.designation.name
    } else {
        formatEmployee.designation = emsModel.designation
    }
    if (emsModel.department && emsModel.department.name) {
        formatEmployee.department = emsModel.department.name
    } else {
        formatEmployee.department = emsModel.department
    }

    if (emsModel.supervisor) {
        formattedEmployee.supervisor = formatEmployee(emsModel.supervisor)
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
            return formatEmployee(emp)
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

exports.reform = formatEmployee
