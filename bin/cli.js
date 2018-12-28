'use strict'
global.Promise = require('bluebird')
global.processSync = true

const fs = require('fs')
const logger = require('@open-age/logger')('cli')

require('../helpers/string')
require('../helpers/number')
require('../helpers/toObjectId')
require('../helpers/period')
require('../settings/database').configure(logger)
require('../settings/offline-processor').configure(logger)
const moment = require('moment')

const cli = require('cli')
const colors = require('colors')
const appRoot = require('app-root-path')
const paramCase = require('param-case')
const inquirer = require('inquirer')
const db = require('../models')

var options = cli.parse({
    type: ['t', 'type of job/entity', 'string'],
    date: ['d', 'date', 'string'],
    model: ['d', 'model', 'string'],
    query: ['q', 'params in query string format', 'string'],
    organization: ['o', 'the organization', 'string'],
    employee: ['e', 'the employee', 'string'],
    token: ['a', 'the access token', 'string'],
    file: ['f', 'a file to process', 'file']
}, ['get', 'job', 'import'])

const getOrg = async (codeOnly) => {
    if (options.organization) {
        cli.info(`organization: ${options.organization}`)
    }

    if (!options.organization) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'organization', message: 'code of the organization' }])
        options.organization = prompt.organization
    }

    if (options.organization === 'all') {
        return null
    }

    if (codeOnly) {
        return options.organization
    }

    let organization = db.organization.findOne({ code: options.organization })

    if (!organization) {
        return getOrg()
    }
    return organization
}

const getEmployee = async (codeOnly) => {
    if (options.employee) {
        cli.info(`employee: ${options.employee}`)
    }

    if (!options.employee) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'employee', message: 'code of the employee' }])
        options.employee = prompt.employee
    }

    if (codeOnly) {
        return options.employee
    }

    let organization = getOrg()

    let employee = db.employee.findOne({
        code: options.employee,
        organization: organization
    })

    if (!employee) {
        return getEmployee()
    }
    return employee
}

const getType = async (message) => {
    message = message || 'type of entity/collection'
    if (options.type) {
        cli.info(`${message}: ${options.type}`)
    }
    if (!options.type) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'type', message: message }])
        options.type = prompt.type
    }

    return options.type
}

const getDate = async (message) => {
    message = message || 'date in YYYY-MM-DD format'
    if (options.date) {
        cli.info(`${message}: ${options.date}`)
    }
    if (!options.date) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'date', message: message }])
        options.date = prompt.date
    }

    return moment(options.date).toDate()
}

const getModel = async (message) => {
    message = message || 'model in json format'
    if (options.model) {
        cli.info(`${message}: ${options.model}`)
    }
    if (!options.model) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'model', message: message }])
        options.model = prompt.model
    }

    let model = options.model ? JSON.parse(options.model) : null

    return model
}

const getCommand = async (message) => {
    message = message || 'command'
    if (cli.command) {
        cli.info(`command: ${cli.command}`)
    }
    if (!cli.command) {
        let prompt = await inquirer.prompt([{ type: 'input', name: 'command', message: message }])
        cli.command = prompt.command
    }

    return cli.command
}

let getContext = async () => {
    return {
        employee: await getEmployee(),
        organization: await getOrg(),
        logger: logger,
        onProgress: onProgress
    }
}

let onProgress = (progress, outOf) => {
    if (!outOf || !progress || typeof outOf !== 'number' || typeof progress !== 'number') {
        return
    }
    cli.progress(progress / outOf)
}

// cli.info(`environment: ${process.env.NODE_ENV}`)

const getMethod = (folder, type, action) => {
    let handlerFile = `${appRoot}/${folder}/${paramCase(type)}`

    if (!fs.existsSync(handlerFile + '.js')) {
        throw new Error(`${handlerFile}.js not found`)
    }

    let handler = require(`../${folder}/${type}`)

    if (!handler[action]) {
        throw new Error(`${handlerFile}.js does not implement '${action}' method`)
    }

    return handler[action]
}

const executeJob = async () => {
    let type = await getType('job name')
    let method = getMethod('jobs', type, 'run')
    let orgCode = await getOrg(true)
    let date = await getDate()

    await method(orgCode, date)
}

const executeImport = async () => {
    let type = await getType('name importer')

    let method = getMethod('imports', type, 'run')

    let req = {
        sync: true,
        context: await getContext(),
        data: await getModel()
    }

    if (options.file) {
        req.file = options.file
    }

    let res = await method(req, onProgress)
    cli.progress(1)
    let output = '' + (res || 'complete')
    cli.ok(output.green)
}

const executeService = async () => {
    let type = await getType('name of service')
    let method = getMethod('imports', type, 'search')
    let context = await getContext()
    req.data = data
    res = await method(req, context)
    cli.progress(1)
    let output = '' + (res || 'complete')
    cli.ok(output.green)
}

(async () => {
    // NODE_ENV=prod node bin/cli
    cli.info(`environment: ${process.env.NODE_ENV}`)

    try {
        let command = await getCommand()
        switch (command) {
        case 'import':
            await executeImport()
            break
        case 'job':
            await executeJob()
            break
        case 'search':
            await executeService()
            break
        default:
            cli.error(`command '${cli.command}' is yet to be implemented `)
            break
        }
    } catch (err) {
        cli.error(err)
        cli.exit()
        return
    }
    cli.info('done')
    cli.exit(1)
})()
