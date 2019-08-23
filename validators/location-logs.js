'use strict'
const maps = require('../providers/google-maps')
const db = require('../models')

exports.canTrackLocation = async (req) => {
    if (!req.body.location || !req.body.location.coordinates) {
        throw new Error('location coordinates are required')
    }
}
