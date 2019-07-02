'use strict'

const defaultConfig = require('config').get('providers.edualaya-employees')
const logger = require('@open-age/logger')('providers.edualaya-employees')
const client = new require('node-rest-client-promise').Client()
const _ = require('underscore')
var moment = require('moment')
let parsedConfig = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        url: config.url || defaultConfig.url,
        api_key: config.api_key,
        orgCode: config.orgCode,
        lastSyncDate: config.lastSyncDate
    }
}

const getEmployees = (config, context) => {
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'orgCode': config.orgCode,
            'x-api-token': config.api_key // TODO: was ["external-token"];
        },
        parameters: {
            noPaging: true,
            'f[0][f]': 'employee_lastModifiedDate',
            'f[0][v]': config.lastSyncDate ? config.lastSyncDate.toISOString() : null
        }
    }

    return client.getPromise(config.url, args).then(response => response.data.items)
}

const formatEmployee = (emp, context) => {
    if (emp.EmployeeNo === null || emp.EmployeeNo === undefined) {
        return null
    }
    let formattedEmployee = {
        organization: context.organization,
        EmpDb_Emp_id: emp.Id,
        name: emp.User.Name,
        code: emp.EmployeeNo,
        designation: emp.Designation.Name,
        picUrl: emp.User.ImageBoxUrl || null,
        email: emp.User.Email,
        dob: emp.User.DOB,
        gender: emp.User.Gender,
        picData: emp.User.picData || null,
        phone: emp.User.Mobile,
        userType: emp.userType || 'normal',
        status: (emp.Status ? ((emp.Status.toLowerCase() === 'left' || emp.Status.toLowerCase() === 'suspended' || emp.Status.toLowerCase() === 'relieved') ? 'inactive' : 'active') : 'active'),
        shift: {
            name: emp.Shift.Name,
            startTime: emp.Shift.StartTime,
            endTime: emp.Shift.EndTime
        },
        supervisor: emp.ReportingOfficer ? {
            organization: context.organization,
            code: emp.ReportingOfficer.EmployeeNo,
            EmpDb_Emp_id: emp.ReportingOfficer.Id,
            name: emp.ReportingOfficer.User.Name,
            designation: emp.Designation.Name,
            email: emp.User.Email,
            phone: emp.User.Mobile,
            status: (emp.ReportingOfficer.Status ? ((emp.ReportingOfficer.Status.toLowerCase() === 'left' || emp.ReportingOfficer.Status.toLowerCase() === 'suspended' || emp.ReportingOfficer.Status.toLowerCase() === 'relieved') ? 'inactive' : 'active') : 'active')
        } : null
    }

    if (formattedEmployee.status === 'inactive') {
        formattedEmployee.deactivationDate = moment().endOf('day')
    }

    return formattedEmployee
}
/**
 * fetches employees from ems
 * @param fromDate - the date since when the employees have changed
 * @param config - ems config of that org
 * @returns employees
 */
exports.fetch = (config, context) => {
    return getEmployees(parsedConfig(config), context).then(employees => {
        return _(employees).map((emp) => {
            return formatEmployee(emp, context)
        })
    })
}

/**
 * creates and updates the employee changes to orange hr
 * @param changes list of employees grouped by created and updated
 * @param config - ems config of that org
 * @returns status of call
 */
exports.push = (changes, config, context) => {
    Promise.reject(new Error('not implemented'))
}
