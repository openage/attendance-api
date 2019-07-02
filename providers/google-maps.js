'use strict'
const client = new require('node-rest-client-promise').Client()
const locationConfig = require('config').get('location')

const getDistance = (originsPoints, destinationsPoints) => {
    let routeDetails = {}
    let args = {
        path: {
            units: locationConfig.units,
            origins: `${originsPoints[1]},${originsPoints[0]}`,
            destinations: `${destinationsPoints[1]}%2C${destinationsPoints[0]}%7C`,
            key: locationConfig.key
        }
    }

    return client.getPromise(locationConfig.milesUrl, args)
        .then((response) => {
            routeDetails.distance = response.data.rows[0].elements[0].distance ? response.data.rows[0].elements[0].distance.value : 0
            routeDetails.duration = response.data.rows[0].elements[0].duration ? response.data.rows[0].elements[0].duration.value : 0
            return Promise.resolve(routeDetails)
        })
}

// location is object with coordinates and to update name and description
const getLocality = (location) => {
    let args = {
        path: {
            latlng: `${location.coordinates[1]}, ${location.coordinates[0]}`,
            key: locationConfig.key
        }
    }

    return client.getPromise(locationConfig.localityUrl, args)
        .then((response) => {
            location.name = response.data.results.length !== 0 ? response.data.results[2].formatted_address : ''
            location.description = response.data.results.length !== 0 ? response.data.results[0].formatted_address : ''
            return location
        })
        .catch(err => {
            return err
        })
}

exports.getDistance = getDistance
exports.getLocality = getLocality
