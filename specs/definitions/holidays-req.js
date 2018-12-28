module.exports = [{
    name: 'holidaysReq',
    properties: {
        'holidays': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string'
                    },
                    'date': {
                        'type': 'string'
                    }
                }
            }
        }
    }
}]
