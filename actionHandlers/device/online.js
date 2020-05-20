const sendIt = require('@open-age/send-it-client')
const mapper = require('../../mappers/device')

exports.process = async (entity, context) => {
    let model = mapper.toModel(entity, context)

    await sendIt.dispatch({
        data: {
            device: model
        },
        meta: {
            entity: {
                id: model.id,
                type: 'ams|device'
            }
        },
        template: {
            code: 'ams|device-online'
        },
        conversation: {
            entity: {
                id: context.organization.code,
                type: 'system'
            }
        },
        to: 'everyone',
        from: 'system',
        options: {
            priority: 'high',
            modes: { push: true }
        }
    }, context)
}
