module.exports = [{
    name: 'dailyInsightReq',
    properties: {
        'employee': {
            'type': 'string'
        },
        'alert': {
            'type': 'string'
        },
        'date': {
            'type': 'string'
        },
        'onHome': {
            'type': 'boolean'
        },
        'statistics': {
            'type': 'object',
            'properties': {
                'count': {
                    'type': 'number'
                },
                'params': {
                    'type': 'object',
                    'properties': {
                        'param': {
                            'type': 'string'
                        },
                        'count': {
                            'type': 'string'
                        }
                    }
                }
            }
        }

    }
}]
