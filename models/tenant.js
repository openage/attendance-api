'use strict'
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    logo: {
        url: String,
        thumbnail: String
    },
    config: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}
