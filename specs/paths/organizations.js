module.exports = [{
    url: '/',
    post: {
        'parameters': [{
            'name': 'body',
            'description': 'First Time in AMS',
            'required': true,
            'schema': {
                '$ref': '#/definitions/orgReq'
            }
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

}, {
    url: '/{id}',
    put: {
        'parameters': [{
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/orgReq'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'organization id',
            'required': true,
            'type': 'string'
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
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'my or orgnization id',
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
