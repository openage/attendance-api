module.exports = [{
    url: '/',
    post: {
        'summary': 'Sync Logs of device',
        'description': 'Sync Logs of device',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/deviceSyncLog'
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
        'summary': 'Get Device Logs',
        'description': 'Get Decice Logs',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'send date (DD-MM-YYYY)'
        }, {
            'name': 'status',
            'in': 'query',
            'description': 'send status'
        }, {
            'name': 'pageNo',
            'in': 'query',
            'description': 'Page Number'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'Page Size '
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
