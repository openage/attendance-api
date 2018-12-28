module.exports = [{
    url: '/',
    post: {
        'summary': 'Create Categories',
        'description': 'categories details',
        'parameters': [{
            'name': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/machinesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token'
        }],
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
