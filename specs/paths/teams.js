module.exports = [{
    url: '/{id}/teamMembers',
    get: {
        'summary': 'Get Team',
        'description': 'get Team',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'set  my to get your team otherwise id',
            'required': true,
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'set date to get attendance accordingly',
            'type': 'string'
        }, {
            'name': 'pageNo',
            'in': 'query',
            'description': 'pageNo',
            'type': 'string'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'pageSize',
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
