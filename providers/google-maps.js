'use strict'
const genericProvider = require('../helpers/generic-provider')

const config = require('config').get('providers.geolib')

exports.getDistance = async (fromCoordinates, toCoordinates) => {
    let result = await genericProvider('geolib').get({
        units: config.units,
        origins: `${fromCoordinates[1]},${fromCoordinates[0]}`,
        destinations: `${toCoordinates[1]}%2C${toCoordinates[0]}%7C`
    })
    let routeDetails = {
        distance: 0,
        duration: 0
    }

    if (result.rows && result.rows.length && result.rows[0].elements && result.rows[0].elements.length) {
        const element = result.rows[0].elements[0]

        if (element.distance) {
            routeDetails.distance = element.distance.value
        }

        if (element.duration) {
            routeDetails.duration = element.duration.value
        }
    }

    return routeDetails
}

exports.getLocality = async (coordinates) => {
    let results = await genericProvider('geolib').get({
        latlng: `${coordinates[1]}, ${coordinates[0]}`
    })
    let location = {
        coordinates: coordinates
    }

    if (results.length > 0) {
        location.name = results[2].formatted_address
        location.description = results[0].formatted_address
    }

    return location
}
