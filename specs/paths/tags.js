module.exports = [{
    url: '/',
    post: {
        'summary': 'Create Tags',
        'description': 'Craate Tag With Tag Type',
        'parameters': [{
            'name': 'body',
            'description': 'Tag details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/tagReq'
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
    url: '/{id}',
    get: {
        'summary': 'Get tags',
        'description': 'get tags',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'tagType Id corresponding to all tags',
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
    url: '/byType/{id}',
    get: {
        'summary': 'Get tags',
        'description': 'get tags by tagtype',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'tagType Id corresponding to all tags',
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
