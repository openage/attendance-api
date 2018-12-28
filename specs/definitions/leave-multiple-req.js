module.exports = [{
    name: 'LeaveMultipleReq',
    properties: {
        'leaves': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
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
                    'leaveType': {
                        'type': 'string'
                    }
                }
            }
        }
    }
}]
