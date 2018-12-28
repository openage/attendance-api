module.exports = [{
    url: '/sync',
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
            'name': 'x-access-token'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'deviceId',
            'in': 'query',
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
}, {
    url: '/push',
    put: {
        'summary': 'PUSH Logs',
        'description': 'PUSH Logs',
        'consumes': ['multipart/form-data'],
        'parameters': [{
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
}, {
    url: '/',
    get: {
        'summary': 'get Logs',
        'description': 'Sync Logs',
        'parameters': [{
            'name': 'fromDate',
            'in': 'query',
            'description': 'fromDate'
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
    },
    post: {
        'summary': 'Create Log',
        'description': 'Create Logs',
        'parameters': [{
            'name': 'body',
            'description': 'Log details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/createLog'
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
}, {
    url: '/{filename}',
    get: {
        'summary': 'download Attendance Sync Sheet',
        'description': 'Sync Logs',
        'parameters': [{
            'name': 'filename',
            'in': 'path',
            'description': 'filename',
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
