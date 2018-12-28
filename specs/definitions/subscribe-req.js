module.exports = [{
    name: 'subscribeReq',
    properties: {
        'config': {
            'type': 'object',
            'properties': {
                'trigger': {
                    'type': 'object'
                },
                'processor': {
                    'type': 'object',
                    'properties': {
                        'channel': {
                            'type': 'string'
                        }
                    }
                }
            }
        }
    }
}]
