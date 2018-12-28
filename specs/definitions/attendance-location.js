module.exports = [{
    name: 'AttendanceLocation',
    properties: {
        'time': {
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
