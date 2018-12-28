module.exports = [{
    url: '/current',
    get: {
        'summary': 'check version details',
        'description': 'Get info regarding version details',
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
