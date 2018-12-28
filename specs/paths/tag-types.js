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
                '$ref': '#/definitions/tagTypeReq'
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
    },
    get: {
        'summary': 'Get tagTypes',
        'description': 'get all tagtypes of org',
        'parameters': [{
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
