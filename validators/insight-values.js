'use strict'

exports.canSearch = async (req) => {
    if (!req.query.insightId) {
        return 'insightId is required'
    }

    if (!req.query.type) {
        return 'type is required'
    }
}
