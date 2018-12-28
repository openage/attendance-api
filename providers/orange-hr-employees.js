'use strict'
const logger = require('@open-age/logger')('provider.orange-hr-employees')
let Client = require('node-rest-client-promise').Client
let client = new Client()
var defaultConfig = require('config').get('providers.orange-hr-employees')
var _ = require('underscore')

let parsedConfig = (config) => {
    if (!config) {
        return defaultConfig
    }

    return {
        url: config.url || defaultConfig.url,
        api_key: config.api_key,
        lastSyncDate: config.lastSyncDate
    }
}

/**
 * fetches employees from orange hr
 * @param config - ems config of that org
 * @returns employees
 */
exports.fetch = (config, context) => {
    Promise.reject(new Error('not implemented'))
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
