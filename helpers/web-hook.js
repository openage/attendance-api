const client = new (require('node-rest-client-promise')).Client()
var providerConfig = require('config').get('providers')
var appRoot = require('app-root-path')
var fs = require('fs')
var paramCase = require('param-case')

const getConfig = (entity, action, context) => {
    let orgLevel = context.getConfig(`${entity}.hooks.${action}`)

    if (!orgLevel) {
        return
    }

    let config = {
        url: orgLevel.url,
        action: orgLevel.action,
        headers: orgLevel.headers,
        data: orgLevel.data,
        reponse: orgLevel.response
    }

    if (!config.action) {
        config.action = 'POST'
    }

    if (!config.response) {
        config.response = {}
    }

    if (!config.response.field) {
        config.response.field = 'data'
    }

    return config
}

const map = (data, entity, config, context) => {
    if (config.data) {
        return config.data
    }

    let mapper = null

    if (config.type && fs.existsSync(`${appRoot}/mappers/${paramCase(config.type)}/${entity}.js`)) {
        mapper = require(`${appRoot}/mappers/${paramCase(config.type)}/${entity}`)
    }

    if (!mapper && fs.existsSync(`${appRoot}/mappers/${entity}.js`)) {
        mapper = require(`${appRoot}/mappers/${entity}`)
    }

    mapper = mapper || {}

    if (mapper.toModel) {
        return mapper.toModel(data, context)
    }

    return data
}

const buildUrl = (data, config, context) => {
    return config.url.inject({
        data: data,
        context: context
    })
}

const buildHeader = (data, config, context) => {
    let headers = {}
    Object.keys(config.headers).forEach(key => {
        headers[key] = config.headers[key].inject({
            data: data,
            context: context
        })
    })

    return headers
}

const parseResponse = (response, config, context) => {
    if (response) {
        return response[config.response.field]
    }

    return 'success'
}

/**
 *
 *
 * @param {*} entity
 * @param {*} action
 * @param {*} data
 * @param {*} context
 * @returns
 */
exports.send = async (entity, action, data, context) => {
    let config = getConfig(entity, action, context)
    if (!config) {
        context.logger.debug(`helpers/web-hook.send: no config found`)
        return
    }

    let model = map(data, entity, config, context)

    let url = buildUrl(model, config, context)

    let logger = context.logger.start(`helpers/web-hook.send ${url}`)

    const args = {
        headers: buildHeader(data, config, context),
        data: model
    }
    let response = await client.postPromise(url, args)

    let parsedResponse = parseResponse(response, config, context)

    logger.debug('reponse', parsedResponse)
    logger.end()

    return parseResponse
}
