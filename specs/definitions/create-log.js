module.exports = [{
    name: 'createLog',
    properties: {
        'type': {
            'type': 'string'
        },
        'device': {
            'type': 'string'
        },
        'time': {
            'type': 'string'
        },
        'source': {
            'type': 'string'
        },
        'location': {
            'type': 'object',
            'properties': {
                'coordinates': {
                    'type': 'array',
                    'items': {
                        'type': 'integer'
                    }
                },
                'name': {
                    'type': 'string'
                },
                'description': {
                    'type': 'string'
                }
            }
        }
    }
}]
