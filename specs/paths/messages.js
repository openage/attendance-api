module.exports = [{
    url: '/reportBug',
    post: {
        'summary': 'Report a Bug to Admin',
        'description': 'Report a Bug to Admin',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'Community Details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/BugReq'
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
    }
}]
