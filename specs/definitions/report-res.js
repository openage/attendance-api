module.exports = [{
    name: 'reportRes',
    properties: {
        'params': {
            'type': 'object',
            'properties': {
                'requestedAt': {
                    'type': 'string'
                },
                'startedAt': {
                    'type': 'string'
                },
                'completedAt': {
                    'type': 'string'
                },
                'filepath': {
                    'type': 'string'
                },
                'fileUrl': {
                    'type': 'string'
                },
                'error': {
                    'type': 'string'
                },
                'params': {
                    'type': 'object'
                },
                'status': {
                    'type': 'string'
                }
            }
        }
    }
}]
