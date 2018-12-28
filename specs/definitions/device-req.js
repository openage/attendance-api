module.exports = [{
    name: 'deviceReq',
    properties: {
        'ip': {
            'type': 'string'
        },
        'port': {
            'type': 'string'
        },
        'name': {
            'type': 'string'
        },
        'bssid': {
            'type': 'string'
        },
        'category': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                }
            }
        },
        'mute': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'start': {
                        'type': 'string'
                    },
                    'end': {
                        'type': 'string'
                    }
                }
            }
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
        },
        'machine': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                }
            }
        }
    }
}]
