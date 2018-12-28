'use strict'
const moment = require('moment')
const entities = require('../../../helpers/entities')
const geolib = require('geolib')
const Client = require('node-rest-client-promise').Client
const client = new Client()
const geoConfig = require('config').geoLocation
const communications = require('../../../services/communications')
const db = require('../../../models')

exports.process = (data, alert, context) => {
    let supervisorLevel = 1
    let channels = ['push']
    let minutes = 60
    let distance = 100

    if (alert.config.trigger) {
        minutes = alert.config.trigger.minutes || minutes
        distance = alert.config.trigger.distance || distance
    };

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    };

    return db.locationLog.findById(data.id).then(locationLog => {
        db.locationLog.findOne({
            attendance: locationLog.attendance,
            employee: locationLog.employee,
            message: { $exists: false },
            time: {
                $gte: moment(locationLog.time.toISOString()).subtract(minutes, 'minute').toDate(),
                $lt: moment(locationLog.time.toISOString()).toDate()
            }
        }).populate('employee').then(previousLocationLog => {
            if (!previousLocationLog) { return Promise.cast(null) }

            let diff = geolib.getDistance({
                latitude: locationLog.location.coordinates[1],
                longitude: locationLog.location.coordinates[0]
            }, {
                latitude: previousLocationLog.location.coordinates[1],
                longitude: previousLocationLog.location.coordinates[0]
            })

            if (diff > distance) { return null }

            previousLocationLog.employee.coordinates = locationLog.location.coordinates

            // return communications.send({
            //     employee: previousLocationLog.employee,
            //     level: supervisorLevel
            // }, {
            //     actions: [],
            //     entity: entities.toEntity(previousLocationLog.employee, 'location'),
            //     data: {
            //         name: previousLocationLog.employee.name || previousLocationLog.employee.code,
            //         minutes: minutes
            //     },
            //     template: 'location-not-changed'
            // }, channels, context);
            let args = {
                parameters: {
                    latlng: `${locationLog.location.coordinates[1]},${locationLog.location.coordinates[0]}`,
                    key: geoConfig.googleKey
                }
            }

            return client.postPromise(geoConfig.url, args)
                .then(response => {
                    let location = response.data.results[0].formatted_address

                    return communications.send({
                        employee: previousLocationLog.employee,
                        level: supervisorLevel
                    }, {
                        actions: [],
                        entity: entities.toEntity(previousLocationLog.employee, 'location'),
                        data: {
                            name: previousLocationLog.employee.name || previousLocationLog.employee.code,
                            minutes: minutes,
                            location: location,
                            genderText: (previousLocationLog.employee.gender && previousLocationLog.employee.gender.toLowerCase() == 'female') ? 'She' : 'He'
                        },
                        template: 'location-not-changed'
                    }, channels, context)
                })
                .catch(err => {
                    return Promise.cast(null)
                })
        })
    }).catch(err => {
        return Promise.cast(null)
    })
}
