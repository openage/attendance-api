module.exports = [{
    url: '/',
    get: {
        'summary': 'Get shifts',
        'description': 'get shifts',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'shiftTypeId',
            'in': 'query',
            'description': 'shiftTypeId',
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
    post: {
        'summary': 'Create shifts',
        'description': 'Create shifts',
        'parameters': [{
            'name': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/shiftReq'
            }
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
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
    }
},
{
    url: '/{id}',
    get: {
        'summary': 'Get single shift',
        'description': 'get shift',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'shift id',
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
},
{
    url: '/many',
    post: {
        'summary': 'Create shifts',
        'description': 'Create shifts',
        'parameters': [{
            'name': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/shiftReq'
            }
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
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
    }
}]
