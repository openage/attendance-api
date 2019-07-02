'use strict'
const logger = require('@open-age/logger')('validators/attendances')
const maps = require('../providers/google-maps')

exports.canTrackLocation = async (req, callback) => {
    let log = logger.start('canTrackLocation')

    if (!req.body.location || !req.body.location.coordinates) {
        return callback('location coordinates are required')
    }

    const lastLocation = await db.locationLog.findOne({attendance: req.params.id, employee: req.employee.id }).sort({_id: -1})

    if (lastLocation) {
        const routeDetails = await maps.getDistance(lastLocation.location.coordinates, req.body.location.coordinates)
        req.body.duration = routeDetails.duration
        req.body.distance = routeDetails.distance
    }

    return callback()
}
