const client = require('node-rest-client-promise').Client

const parseResponse = (response, config) => {
    if (config.response && response) {
        return response[config.response.field]
    }

    if (response && response.data) {
        return response.data
    }

    return response
}

const getParams = (params, config) => {
    let parameters = {}

    let configParams = config.query

    if (configParams) {
        for (const key in configParams) {
            parameters[key] = configParams[key]
        }
    }

    if (params) {
        for (const key in params) {
            parameters[key] = params[key]
        }
    }

    return parameters
}

const getHeaders = (config) => {
    let headers = {
        'Content-Type': 'application/json'
    }

    let configHeaders = config.headers

    if (config.headers) {
        for (const key in configHeaders) {
            headers[key] = configHeaders[key]
        }
    }

    return headers
}

exports = (name) => {
    const config = require('config').get(`providers.${name}`)
    return {
        get: async (query) => {
            let args = {
                headers: getHeaders(config),
                parameters: getParams(query, config)
            }
            let response = await (new client()).getPromise(config.url, args)

            return parseResponse(response, config)
        }
    }
}
