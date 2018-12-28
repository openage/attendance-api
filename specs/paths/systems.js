module.exports = [{
    url: '/usage',
    get: {
        'summary': 'Get System usage',
        'description': 'Get System usage of all org',
        'parameters': [],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/Error'
                }
            }
        }
    }
}]
