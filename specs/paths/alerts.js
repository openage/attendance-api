module.exports = [{
    url: '/',
    post: {
        'summary': 'Create alerts',
        'description': 'alerts details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'in name Config Parameters will be in {{}} ',
            'required': true,
            'schema': {
                '$ref': '#/definitions/alertReq'
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
        'summary': 'Get all alerts',
        'description': 'get all',
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
},
{
    url: '/{id}',
    put: {
        'summary': 'Update alert after subscribed',
        'description': 'alert details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'in name Config Parameters will be in {{}} ',
            'required': true,
            'schema': {
                '$ref': '#/definitions/subscribeReq'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'alert Id',
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
        'summary': 'Get Single alert',
        'description': 'Get Single alert',
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
            'description': 'alert',
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
    url: '/subscribe/{id}',
    put: {
        'summary': 'subscribe alert',
        'description': 'subscribe detail',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'alertType Id',
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
