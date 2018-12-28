module.exports = [{
    url: '/',
    post: {
        'summary': 'Create with external Token/Url',
        'description': 'Create with external Token/Url',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/empExtReq'
            }
        }, {
            'name': 'external-token',
            'in': 'header',
            'description': 'external-token (of any application)',
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
        'parameters': [{
            'name': 'name',
            'in': 'query',
            'description': 'search employee by name',
            'type': 'string'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'code of employee',
            'type': 'string'
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
            'name': 'pageNo',
            'in': 'query',
            'description': 'pageNo',
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
    url: '/upload/shiftType/xl',
    post: {
        'summary': 'sync employees',
        'description': 'sync employees',
        'consumes': ['multipart/form-data'],
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
            'in': 'formData',
            'name': 'record',
            'type': 'file',
            'description': 'file to upload'
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
    url: '/sync/updates',
    get: {
        'summary': 'sync employees',
        'description': 'sync employees',
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
            'name': 'external-token',
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
    url: '/get/birthdays',
    get: {
        'summary': 'get bdays',
        'description': 'get all bdays of date',
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
            'name': 'date',
            'in': 'query',
            'description': 'to get bdays of that day'
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
    url: '/from/team',
    get: {
        'summary': 'Get employees from Team',
        'description': 'get employees from Team',
        'parameters': [{
            'name': 'name',
            'in': 'query',
            'description': 'search employee by name',
            'type': 'string'
        }, {
            'name': 'pageNo',
            'in': 'query',
            'description': 'send Number'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'send Number'
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
    url: '/get/supervisor/{id}',
    get: {
        'summary': 'Get supervisor',
        'description': 'get supervisor with attendance',
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
            'description': 'my for get your supervisor otherwise id',
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
    url: '/makeTunnel',
    put: {
        'summary': 'signup with Tunnel',
        'description': 'signUp',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/empExtReq'
            }
        }, {
            'name': 'external-token',
            'in': 'header',
            'description': 'token',
            'required': true
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
    url: '/importer',
    post: {
        'summary': 'Importer Employee DUMP',
        'description': 'Importer',
        'parameters': [{
            'in': 'formData',
            'name': 'file',
            'type': 'file',
            'description': 'Attendance XL details',
            'required': true
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
    url: '/fromEms',
    post: {
        'summary': 'Create from Ems',
        'description': 'Create from Ems ( if Org is present in Ams)',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'body',
            'in': 'body',
            'description': 'details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/EmpReq'
            }
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
        'summary': 'update employee',
        'description': 'update employee ',
        'parameters': [{
            'in': 'body',
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/updateEmpReq'
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
    },
    get: {
        'summary': 'Get single employee',
        'description': 'get employee',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': "se my to get your data else 'id'",
            'required': true
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'To get attendance model of that date',
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
    url: '/forAdmin/{id}',
    get: {
        'summary': 'Get single employee',
        'description': 'get employee',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'id',
            'in': 'path',
            'description': "se my to get your data else 'id'",
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
    url: '/{id}/fingerPrint',
    post: {
        'summary': 'add fingerPrint to devices',
        'description': 'updating employee with fingerprint and device',
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'id of employee here',
            'required': true
        }, {
            'name': 'operation',
            'in': 'query',
            'description': 'remove add fetch employee here',
            'required': true
        },
        {
            'in': 'body',
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/addFingerPrintReq'
            }
        }
        ],
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
        'summary': 'update fingerPrints',
        'description': 'updating employee with fingerprints',
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'id of employee here',
            'required': true
        }, {
            'in': 'body',
            'description': 'to update fields',
            'required': true,
            'schema': {
                '$ref': '#/definitions/fingerPrintReq'
            }
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }
        ],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/fingerPrintRes'
                }
            }
        }
    },
    get: {
        'summary': 'get fingerPrints',
        'description': 'get fingerprints',
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'id of employee here',
            'required': true
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }
        ],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/fingerPrintRes'
                }
            }
        }
    }
}]
