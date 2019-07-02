'use strict'
const sendIt = require('config').get('providers.sendIt')
const logger = require('@open-age/logger')('providers/sendIt')
const client = new require('node-rest-client-promise').Client()

const dispatch = async (data, templateCode, to, from, modes, options) => {
    const log = logger.start('sending message')

    var args = {
        headers: {
            'Content-Type': 'application/json',
            'x-role-key': from // role key here
        },
        data: {
            'template': {
                'code': templateCode
            },
            'to': to, // Array of objects
            'data': data,
            'modes': modes, // list of modes
            'options': options
        }
    }

    return await client.postPromise(sendIt.url, args)
        .then((data) => {
            if (!data.data.isSuccess) {
                log.error('invalid response from sendIt')
                throw new Error(`invalid response from sendIt`)
            }
            return Promise.resolve(data.data)
        })
        .catch((err) => {
            log.error(err)
            return Promise.reject(err)
        })
}

exports.send = dispatch
