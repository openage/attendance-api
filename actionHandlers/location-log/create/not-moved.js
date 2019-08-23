'use strict'
const moment = require('moment')
const geolib = require('geolib')
const geoConfig = require('config').geolib

const Client = require('node-rest-client-promise').Client
const client = new Client()

const db = require('../../../models')
const users = require('../../../services/employee-getter')

const sendIt = require('@open-age/send-it-client')

const getConfig = (context) => {
    const orgConfig = context.getConfig('location.log.alert.notChanged')

    if (!orgConfig) { return }
    let config = {
        trigger: {
            distance: 100, // in km
            minutes: 60
        },
        action: {
            type: 'notify-supervisor',
            priority: 'low',
            modes: { push: true }
        }
    }

    if (orgConfig.distance) {
        if (orgConfig.trigger.distance) {
            config.trigger.distance = orgConfig.trigger.distance
        }

        if (orgConfig.trigger.minutes) {
            config.trigger.minutes = orgConfig.trigger.minutes
        }
    }

    if (orgConfig.action) {
        if (orgConfig.action.type) {
            config.action.type = orgConfig.action.type
        }

        if (orgConfig.action.priority) {
            config.action.priority = orgConfig.action.priority
        }

        if (orgConfig.action.modes) {
            config.action.modes = orgConfig.action.modes
        }
    }

    return config
}
exports.process = async (locationLog, context) => {
    if (!locationLog.late) {
        return
    }

    let config = getConfig(context)
    if (!config) return

    let previousLocationLog = await db.locationLog.findOne({
        attendance: locationLog.attendance,
        employee: locationLog.employee,
        message: { $exists: false },
        time: {
            $gte: moment(locationLog.time).subtract(config.trigger.minutes, 'minute').toDate(),
            $lt: moment(locationLog.time).toDate()
        }
    })

    if (!previousLocationLog) {
        return
    }

    let distance = geolib.getDistance({
        latitude: locationLog.location.coordinates[1],
        longitude: locationLog.location.coordinates[0]
    }, {
        latitude: previousLocationLog.location.coordinates[1],
        longitude: previousLocationLog.location.coordinates[0]
    })

    if (distance > config.trigger.distance) {
        return
    }

    let response = await client.postPromise(geoConfig.url, {
        parameters: {
            latlng: `${locationLog.location.coordinates[1]},${locationLog.location.coordinates[0]}`,
            key: geoConfig.googleKey
        }
    })

    let address = response.data.results[0].formatted_address

    const user = await users.get(locationLog.employee, context)

    let message = {
        data: {
            attendance: {
                id: locationLog.attendance._doc ? locationLog.attendance.id : locationLog.attendance.toString()
            },
            location: {
                id: locationLog.id,
                address: address,
                coordinates: locationLog.location.coordinates,
                time: locationLog.time,
                distance: distance,
                minutes: config.trigger.minutes
            },
            user: {
                id: user.id,
                name: user.name,
                code: user.code,
                role: { id: user.role.id }
            }
        },
        modes: config.action.modes,
        options: {
            priority: config.action.priority
        }
    }

    switch (config.action.type) {
    case 'notify-supervisor':
        message.to = await users.get(user.supervisor, context)
        message.template = 'user-is-not-moving'
        break
    }

    await sendIt.dispatch(message, context)
}
