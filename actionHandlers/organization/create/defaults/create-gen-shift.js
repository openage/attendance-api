'use strict'
const shiftTypes = require('../../../../services/shift-types')

exports.process = async (data, context) => {
    await shiftTypes.create({
        code: 'gen',
        name: 'General'
    }, context)
}
