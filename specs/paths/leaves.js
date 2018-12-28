module.exports = [{
    url: '/',
    post: {
        'summary': 'Create leave',
        'description': 'Create leave for all',
        'parameters': [{
            'name': 'mob-body',
            'in': 'body',
            'description': 'leave details MOBILE-app',

            'schema': {
                '$ref': '#/definitions/LeaveReq'
            }
        }, {
            'name': 'web-body',
            'in': 'body',
            'description': 'leave details',

            'schema': {
                '$ref': '#/definitions/LeaveReq2'
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
        'summary': 'Get your leaves',
        'description': 'get your leave',
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
            'name': 'status',
            'in': 'query',
            'description': 'status',
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
    }
}, {
    url: '/my/teamLeaves',
    get: {
        'summary': 'Get your teamLeaves',
        'description': 'get your teamLeaves',
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
    url: '/bulk',
    post: {
        'summary': 'Create leave for all',
        'description': 'Create leave for all',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'leave details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/LeaveMultipleReq'
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
}, {
    url: '/{id}',
    delete: {
        'parameters': [{
            'name': 'x-access-token'
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
    },
    get: {
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
            'description': 'set id to get',
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
    put: {
        'parameters': [{
            'name': 'body',
            'description': 'LeaveTypes details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/LeaveReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'x-access-token'
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'set id to get',
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
    url: '/{id}/action',
    put: {
        'summary': 'Action On leave',
        'description': 'Action On leave',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': "status will be  'approved', 'cancelled', 'rejected' (then send 'comment' also)",
            'required': true,
            'schema': {
                '$ref': '#/definitions/LeaveActionReq'
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
            'name': 'id',
            'in': 'path',
            'description': 'set id to get',
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
            'name': 'pageNo',
            'in': 'query',
            'description': 'pageNo',
            'type': 'string'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'pageSize',
            'type': 'string'
        }, {
            'name': 'employeeId',
            'in': 'query',
            'description': 'employeeId'
        }, {
            'name': 'leaveType',
            'in': 'query',
            'description': 'leaveType'
        }, {
            'name': 'status',
            'in': 'query',
            'description': 'leave status'
        }, {
            'name': 'tagId',
            'in': 'query',
            'description': 'send tag ID'
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'leave date'
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
