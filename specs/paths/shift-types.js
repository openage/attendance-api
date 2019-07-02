module.exports = [{
    url: '/',
    post: {
        'summary': 'Create shiftType',
        'description': 'shiftType details',
        'parameters': [{
            'name': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/shiftTypesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token'
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
    put: {
        'summary': 'Update shiftType',
        'description': 'shiftType details',
        'parameters': [{
            'name': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/shiftTypesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token'
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
        'summary': 'Get all shiftTypes',
        'description': 'get shiftTypes',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'employeeId',
            'in': 'query',
            'description': 'Employee-code',
            'required': false
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
    get: {
        'summary': 'Get one shiftType',
        'description': 'get one shiftType',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'shift type id',
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
    delete: {
        'summary': 'delete one shiftType',
        'description': 'delete one shiftType',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'shift type id',
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
    url: '/byDate',
    get: {
        'summary': 'Get shiftType',
        'description': 'get employee shiftType by date',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'shift type id',
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
