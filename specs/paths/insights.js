module.exports = [{
    url: '/',
    get: {
        'parameters': [{
            'name': 'hasInsights',
            'in': 'query',
            'description': 'to get hasInsight alerts',
            'type': 'boolean'
        }, {
            'name': 'hasNotifications',
            'in': 'query',
            'description': 'to get hasNotifications alerts',
            'type': 'boolean'
        }, {
            'name': 'hasReports',
            'in': 'query',
            'description': 'to get hasReports alerts',
            'type': 'boolean'
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
                    '$ref': '#/definitions/insightRes'
                }
            }
        }
    }
}, {
    url: '/{id}/daily/{date}',
    get: {
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'id of alert',
            'required': true,
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'path',
            'description': 'date of which daily alert needed',
            'required': true,
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
        }],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/insightRes'
                }
            }
        }
    },
    post: {
        'parameters': [{
            'name': 'params',
            'in': 'body',
            'description': 'params object here',
            'required': true,
            'schema': {
                '$ref': '#/definitions/requestParams'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'id of alert',
            'required': true,
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'path',
            'description': 'date of which daily alert needed',
            'required': true,
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
        }],
        'responses': {
            'default': {
                'description': 'Unexpected error',
                'schema': {
                    '$ref': '#/definitions/insightList'
                }
            }
        }
    }
}, {
    url: '/{id}/notification',
    get: {
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'alert id here',
            'required': true,
            'type': 'boolean'
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
                    '$ref': '#/definitions/insightRes'
                }
            }
        }
    }
}, {
    url: '/{id}/report',
    get: {
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'alert id here',
            'required': true,
            'type': 'boolean'
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
                    '$ref': '#/definitions/insightRes'
                }
            }
        }
    },
    post: {
        'parameters': [{
            'name': 'params',
            'in': 'body',
            'description': 'params object here',
            'required': true,
            'schema': {
                '$ref': '#/definitions/reportRequestParams'
            }
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'alert id here',
            'required': true,
            'type': 'boolean'
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
                    '$ref': '#/definitions/reportRes'
                }
            }
        }
    }
}, {
    url: '/{id}/report/list',
    get: {
        'parameters': [{
            'name': 'id',
            'in': 'path',
            'description': 'alert id here',
            'required': true,
            'type': 'boolean'
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
                    '$ref': '#/definitions/reportRes'
                }
            }
        }
    }
}]
