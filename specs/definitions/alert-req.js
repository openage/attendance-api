
module.exports = [{
    name: 'alertReq',
    properties: {
        'name': {
            'type': 'string'
        },
        'code': {
            'type': 'string'
        },
        'isDefault': {
            'type': 'boolean'
        },
        'alertType': {
            'type': 'string'
        },
        'handlerName': {
            'type': 'string'
        },
        'parameters': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'key': {
                        'type': 'string'
                    },
                    'val': {
                        'type': 'string'
                    }
                }
            }
        }
    }
}]
