const leaveTypes = require('../../../../services/leave-types')
const db = require('../../../../models')

exports.process = async (data, context) => {
    let items = await db.leaveTypes.find({
        'periodicity.type': 'monthly',
        'organization': context.organization
    })

    for (const item of items) {
        let log = context.logger.start()
        await leaveTypes.grant(item, context)
        log.end()
    }
}
