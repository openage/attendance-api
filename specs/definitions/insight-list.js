module.exports = [{
    name: 'insightList',
    properties: {
        'employees': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'code': {
                        'type': 'string'
                    },
                    'name': {
                        'type': 'string'
                    },
                    'statistics': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'params': {
                                    'type': 'object',
                                    'properties': {
                                        'filter1': {
                                            'type': 'string'
                                        },
                                        'filter2': {
                                            'type': 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}]
