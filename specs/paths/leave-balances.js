module.exports = [{
    url: '/forMany',
    get: {
        'summary': 'Create leaveBalances for all',
        'description': 'Create leaveBalances for all',
        'parameters': [{
            'name': 'body',
            'description': 'LeaveTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/LeaveBalReq'
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
    url: '/{id}',
    put: {
        'parameters': [{
            'in': 'body',
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/leaveBalanceUpdateReq'
            }
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true,
            'type': 'string'
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'set my to to update yours profile otherwise id',
            'required': true,
            'type': 'string'
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
    url: '/importer/excel',
    get: {
        'summary': 'importer leaveBalances for all',
        'description': 'importer leaveBalances for all',
        'parameters': [{
            'in': 'formData',
            'name': 'file',
            'type': 'file',
            'description': 'leaveBalances XL details',
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
        'summary': 'Get employee getCurrentYearBal leaveBalances',
        'description': 'get employee getCurrentYearBal leaveBalances',
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
            'in': 'query',
            'description': 'set my to to update yours profile otherwise id',
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
    url: '/my/organization',
    get: {
        'summary': 'Get your  organization Leaves',
        'description': 'get your organization Leaves',
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
            'name': 'name',
            'in': 'query',
            'description': 'name'
        }, {
            'name': 'tagId',
            'in': 'query',
            'description': 'send tagId'
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
}, {
    url: '/multi/{employee}',
    get: {
        'summary': 'Update your organization Leaves',
        'description': 'get your organization Leaves',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'LeaveTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/multiLeaveBal'
            }
        }, {
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
            'name': 'employee',
            'in': 'path',
            'description': 'employee id',
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
