module.exports = [{
    name: 'TeamReq',
    properties: {
        'supervisor': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                }
            }
        },
        'team': {
            'type': 'array',
            'items': {
                'type': 'string'
            }
        }
    }
}]
