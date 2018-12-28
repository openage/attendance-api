module.exports = [{
    name: 'multiLeaveBal',
    type: 'array',
    items: {
        'type': 'object',
        'properties': {
            'leaveType': {
                'type': 'object',
                'properties': {
                    'id': {
                        'type': 'string'
                    }
                }
            },
            'days': {
                'type': 'integer'
            }
        }
    }
}]
