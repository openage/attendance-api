module.exports = [{
    url: '/',
    post: {
        'summary': 'Create Categories',
        'description': 'categories details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/categoriesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/Error'
                }
            }
        }
    },
    get: {
        'summary': 'Get all Categories',
        'description': 'get Categories',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
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
