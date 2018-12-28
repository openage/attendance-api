module.exports = [{
    url: '/',
    post: {
        'description': 'alertType details',
        'parameters': [{
            'name': 'body',
            'description': 'alertTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/alertTypeReq'
            }
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'org-code',
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
        'summary': 'Get all Alert Types',
        'description': 'get all',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
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
    url: '/addChannel/{channelId}',
    post: {
        'summary': 'add Channel',
        'description': 'add Channel',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alertTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/addChannelReq'
            }
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'channelId',
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
    }
},
{
    url: '/{id}',
    post: {
        'summary': 'Update alertType',
        'description': 'alertType details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alertTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/alertTypeReq'
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
        }, {
            'name': 'org-code',
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
        'summary': 'Get Single alertType',
        'description': 'Get Single alertType',
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
            'description': 'alertType',
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
