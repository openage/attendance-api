const client = new (require('node-rest-client-promise')).Client()
var providerConfig = require('config').get('providers')
var appRoot = require('app-root-path')
var fs = require('fs')
var paramCase = require('param-case')

const getMapper = (hook, context) => {
    let mapper = null

    if (fs.existsSync(`${appRoot}/mappers/${paramCase(hook.code)}/${hook.entity}.js`)) {
        mapper = require(`${appRoot}/mappers/${paramCase(hook.code)}/${hook.entity}`)
    }

    if (!mapper && fs.existsSync(`${appRoot}/mappers/${hook.entity}.js`)) {
        mapper = require(`${appRoot}/mappers/${hook.entity}`)
    }

    return mapper || {}
}

const getHooks = (entity, trigger, context) => {
    var hooks = {}

    var hasHooks = false

    // context.tenant.services = context.tenant.services || []
    // for (const service of context.tenant.services) {
    //     if (!service.hooks || !service.hooks[entity] || !service.hooks[entity][trigger]) {
    //         continue
    //     }

    //     hooks[service.code] = mergeHook(hooks[service.code], service, entity, trigger)
    // }

    context.organization.services = context.organization.services || []
    for (const service of context.organization.services) {
        if (!service.hooks || !service.hooks[entity] || !service.hooks[entity][trigger]) {
            continue
        }

        hooks[service.code] = mergeHook(hooks[service.code], service, entity, trigger)
        hasHooks = true
    }

    if (!hasHooks) {
        return []
    }

    let collection = []
    Object.keys(hooks).forEach(code => {
        let hook = hooks[code]
        if (providerConfig[code]) {
            let provider = providerConfig[code]
            hook.version = hook.version || provider.version
            hook.root = hook.root || provider.url

            let handler = provider.hooks[entity][trigger]

            if (handler) {
                hook.url = hook.url || handler.url
                hook.action = hook.action || handler.action
                hook.config = hook.config || handler.config || provider.config
                hook.data = hook.data || handler.data || provider.data
            }
        }
        collection.push(hook)
    })

    return collection
}

const mergeHook = (base, service, entity, trigger) => {
    base = base || {}

    let handler = service.hooks[entity][trigger]

    return {
        code: service.code || base.code,
        entity: entity,
        trigger: trigger,
        version: service.version || base.version,
        root: service.url || base.root,
        url: handler.url || base.url,
        action: handler.action || base.action,
        config: handler.config || service.config || base.config,
        data: handler.data || service.data || base.data
    }
}

const send = async (entity, trigger, data, context) => {
    var hooks = getHooks(entity, trigger, context)

    if (!hooks || !hooks.length) {
        context.logger.debug(`helpers/web-hook.send: no hooks found`)
        return
    }

    for (const hook of hooks) {
        let url = buildUrl(data, hook, context)
        let logger = context.logger.start(`helpers/web-hook.send ${url}`)

        const args = {
            headers: buildHeader(data, hook, context),
            data: buildPayload(data, hook, context)
        }

        let response = null
        hook.action = hook.action || 'POST'

        try {
            switch (hook.action.toUpperCase()) {
                case 'POST':
                    response = await client.postPromise(url, args)
                    break
                case 'PUT':
                    response = await client.putPromise(url, args)
                    break
                case 'GET':
                    response = await client.getPromise(url, args)
                    break
                case 'DELETE':
                    response = await client.deletePromise(url, args)
                    break
            }

            let parsedResponse = parseResponse(response, hook, context)

            logger.info('response', parsedResponse)
        } catch (err) {
            logger.error(err)
        }

        logger.end()
    }

    return parseResponse
}

const buildUrl = (data, hook, context) => {
    var url = hook.url
    if (url.indexOf('http') !== 0) {
        url = `${hook.root}/${url}`
    }

    return url.inject({
        config: hook.config,
        data: data,
        context: context
    })
}

const buildHeader = (data, hook, context) => {
    let headers = {}
    Object.keys(hook.config.headers).forEach(key => {
        headers[key] = hook.config.headers[key].inject({
            config: hook.config,
            data: data,
            context: context
        })
    })

    if (context.tenant) {
        headers['x-tenant-code'] = context.tenant.code
    }

    return headers
}

const buildPayload = (data, hook, context) => {
    if (hook.data) {
        return hook.data
    }

    let mapper = getMapper(hook, context)
    if (mapper.toModel) {
        return mapper.toModel(data, context)
    }

    return data
}

const parseResponse = (response, config, context) => {
    if (config.response) {
        return config.response
    }

    let mapper = getMapper(config.code, context)

    if (mapper && mapper.toResponse) {
        return mapper.toResponse(response)
    }

    if (response) {
        if (response.data && response.data.message) {
            return response.data.message
        }

        if (response.message) {
            return response.message
        }
    }

    return 'success'
}

exports.send = send
exports.getHooks = getHooks
