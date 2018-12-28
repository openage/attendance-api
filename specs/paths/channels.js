module.exports = [{
    url: '/',
    post: {
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'channels create',
            'required': true,
            'schema': {
                '$ref': '#/definitions/channelsReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
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
}, {
    url: '/{id}',
    put: {
        'parameters': [{
            'in': 'body',
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/channelsUpdateReq'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'organization id',
            'required': true,
            'type': 'string'
        }, {
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
