module.exports = [{
    name: 'LeaveReq2',
    properties: {
        'date': {
            'type': 'string'
        },
        'toDate': {
            'type': 'string'
        },
        'days': {
            'type': 'integer'
        },
        'reason': {
            'type': 'string'
        },
        'type': {
            'properties': {
                'name': {
                    'type': 'string'
                },
                'id': {
                    'type': 'string'
                }
            }
        },
        'employee': {
            'properties': {
                'code': {
                    'type': 'string'
                }
            }
        }
    }
}]
