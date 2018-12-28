module.exports = [{
    name: 'channelTypeReq',
    properties: {
        'name': {
            'type': 'string'
        },
        'category': {
            'type': 'string'
        },
        'providerName': {
            'type': 'string'
        },
        'description': {
            'type': 'string'
        },
        'parameters': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string'
                    },
                    'title': {
                        'type': 'string'
                    },
                    'type': {
                        'type': 'string'
                    },
                    'description': {
                        'type': 'string'
                    },
                    'expectedValues': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        }
                    }
                }
            }
        }
    }
}]
