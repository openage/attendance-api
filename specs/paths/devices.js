module.exports = [{
    url: '/',
    get: {
        'summary': 'Get all devices',
        'description': 'get devices',
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
            'name': 'category',
            'in': 'query',
            'description': 'category name',
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
    post: {
        'summary': 'Create devices',
        'description': 'devices details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'ip and port required ',
            'required': true,
            'schema': {
                '$ref': '#/definitions/deviceReq'
            }
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'org-Code',
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
        'summary': 'Update devices',
        'description': 'alerts devices',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alerts details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/deviceReq'
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
            'description': 'org-Code',
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
        'summary': 'Get device',
        'description': 'get device  details',
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
            'description': 'device id',
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
    delete: {
        'summary': 'Delete Device',
        'description': 'Delete Device',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'set id to delete',
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
    url: '/{deviceId}/logs',
    post: {
        'summary': 'Sync Logs',
        'description': 'Sync Logs',
        'consumes': ['multipart/form-data'],
        'parameters': [{
            'in': 'formData',
            'name': 'file',
            'type': 'file',
            'description': 'Attendance XL details',
            'required': true
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'deviceId',
            'in': 'path',
            'description': 'device id',
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
