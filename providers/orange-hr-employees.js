'use strict'
let Client = require('node-rest-client-promise').Client
var defaultConfig = require('config').get('providers.orange-hr-employees')

/**
 * fetches employees from orange hr
 * @param config - ems config of that org
 * @returns employees
 */
exports.fetch = () => {
    Promise.reject(new Error('not implemented'))
}

/**
 * creates and updates the employee changes to orange hr
 * @param changes list of employees grouped by created and updated
 * @param config - ems config of that org
 * @returns status of call
 */
exports.push = () => {
    Promise.reject(new Error('not implemented'))
}
