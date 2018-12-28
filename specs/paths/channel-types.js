module.exports = [{
    url: '/',
    post: {
        'summary': 'Create channelType',
        'description': 'channelType details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alertTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/channelTypeReq'
            }
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
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
        'summary': 'Get all channel Types',
        'description': 'get all',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true
        }, {
            'name': 'category',
            'in': 'query',
            'description': 'category id',
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
    put: {
        'summary': 'Update channelType',
        'description': 'alertType channelType',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alertTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/channelTypeReq'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'organization id',
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
        'summary': 'Get all channeType by id',
        'description': 'get channelType',
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
            'description': 'my or channelType id',
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
