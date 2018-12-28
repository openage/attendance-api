module.exports = [{
    url: '/',
    get: {
        'summary': 'Get All my Notifications',
        'description': 'Get All my Notifications',
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
            'name': 'pageNo',
            'in': 'query',
            'description': 'pageNo',
            'type': 'string'
        }, {
            'name': 'status',
            'in': 'query',
            'description': 'status',
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'date to get notification of that date',
            'type': 'string'
        }, {
            'name': 'employee',
            'in': 'query',
            'description': 'employee',
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
    delete: {
        'summary': 'delete last date All Notifications',
        'description': 'delete last date All Notifications',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'delete previous notifications(yyyy-mm-dd) ',
            'required': true,
            'schema': {
                '$ref': '#/definitions/dateReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
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
}, {
    url: '/{id}/archive/{employee}',
    put: {
        'summary': 'archive notifications',
        'description': 'archive notifications',
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
            'description': 'notifications id',
            'required': true,
            'type': 'string'
        }, {
            'name': 'employee',
            'in': 'path',
            'description': 'it can be me or employee id',
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
