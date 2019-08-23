module.exports = [{
    url: '/extractor',
    get: {
        'summary': 'Extract Attendances',
        'description': 'Extract Attendances',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'name',
            'in': 'query',
            'description': 'send name'
        }, {
            'name': 'shiftType',
            'in': 'query',
            'description': 'send shiftType id'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'send code'
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
    url: '/monthlyPdf',
    get: {
        'summary': 'Monthy Attendances pdf',
        'description': 'Monthy Attendances pdf',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'send code'
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
    url: '/getOneDayAttendances',
    get: {
        'summary': 'One Day Attendances',
        'description': 'One Day Attendances',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'pageNo',
            'in': 'query',
            'description': 'send Number'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'send Number'
        }, {
            'name': 'name',
            'in': 'query',
            'description': 'send name'
        }, {
            'name': 'status',
            'in': 'query',
            'description': 'send status'
        }, {
            'name': 'shiftType',
            'in': 'query',
            'description': 'send shiftType id'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'send code'
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
},
{
    url: '/dayReport',
    get: {
        'summary': 'One Day Attendances Excel',
        'description': 'One Day Attendances Excel',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'name',
            'in': 'query',
            'description': 'send name'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'code'
        }, {
            'name': 'shiftType',
            'in': 'query',
            'description': 'shiftType id'
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
},
{
    url: '/{id}/logs',
    get: {
        'summary': 'Get Attendance And Time logs',
        'description': 'Get Attendance And Time logs',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'fromDate',
            'in': 'query',
            'description': 'send UTC',
            'required': true
        }, {
            'name': 'toDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'id',
            'in': 'path',
            'description': 'set my to get of its own',
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
},
{
    url: '/current/date',
    get: {
        'summary': 'Get Current Date',
        'description': 'Get Current Date and Time',
        'parameters': [{
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
},
{
    url: '/monthReport',
    get: {
        'summary': 'Month Report of single Employee Excel',
        'description': 'Month Report of single Employee Excel',
        'parameters': [{
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of organization',
            'required': true,
            'type': 'string'
        }, {
            'name': 'employee',
            'in': 'query',
            'description': 'id of employee',
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
},
{
    url: '/',
    get: {
        'summary': 'Get your attendences',
        'description': 'get your attendences',
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
            'name': 'fromDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'toDate',
            'in': 'query',
            'description': 'send UTC'
        }, {
            'name': 'employee',
            'in': 'query',
            'description': 'send any employee id to get its attendance'
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
    post: {
        'summary': 'Create attendance',
        'description': 'attendance details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/attendancesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
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
},
{
    url: '/markAbsent',
    post: {
        'summary': 'markAbsent attendance',
        'description': 'attendance details',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'shiftType details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/AbsentAttendancesReq'
            }
        }, {
            'name': 'org-code',
            'in': 'header',
            'description': 'code of org',
            'required': true,
            'type': 'string'
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
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
},
{
    url: '/employee/month/summary',
    get: {
        'summary': 'Get summary attendence',
        'description': 'get summary attendence',
        'parameters': [{
            'name': 'org-code',
            'in': 'header',
            'description': 'Org-Code',
            'required': true
        }, {
            'name': 'pageNo',
            'in': 'query',
            'description': 'send Number'
        }, {
            'name': 'pageSize',
            'in': 'query',
            'description': 'send Number'
        }, {
            'name': 'name',
            'in': 'query',
            'description': 'send name'
        }, {
            'name': 'shiftType',
            'in': 'query',
            'description': 'send shiftType id'
        }, {
            'name': 'code',
            'in': 'query',
            'description': 'send code'
        }, {
            'name': 'x-access-token',
            'in': 'header',
            'description': 'token',
            'required': true
        }, {
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
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
        'summary': 'Get attendence by id',
        'description': 'get attendence by id',
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
            'description': 'attendance id',
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
        'summary': 'Update attendence by id',
        'description': 'Update attendence by id',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alerts details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/attendanceReq'
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
            'description': 'attendance id',
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
},
{
    url: '/{id}/summary',
    get: {
        'summary': 'Get attendence summary',
        'description': 'get attendence summary',
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
            'description': 'set my to to get yours profile otherwise id',
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
},
{
    url: '/my/team/summary',
    get: {
        'summary': 'Get team attendence summary',
        'description': 'get team attendence summary',
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
},
{
    url: '/{id}/addLocation',
    put: {
        'summary': 'Add location of an employee',
        'description': 'Adding location to attendance of an employee',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'location details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/AttendanceLocation'
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
            'description': 'attendanceId',
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
},
{
    url: '/{id}/locationLogs',
    get: {
        'summary': 'Get Employee Location',
        'description': 'Get Employee Location correspponding to attendanceId',
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
            'description': 'attendanceId',
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
},
{
    url: '/{id}/getLocations',
    get: {
        'summary': 'Get Employee Location',
        'description': 'Get Employee Location correspponding to attendanceId',
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
            'description': 'employeeId set my if to get own logs',
            'required': true,
            'type': 'string'
        }, {
            'name': 'date',
            'in': 'query',
            'description': 'date of which logs needed',
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
},
{
    url: '/{id}/extendShift',
    put: {
        'summary': 'extend shift of an employee',
        'description': 'extend shift of an employee via extending checkOutTime of attendance',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'location details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/attendanceExtendReq'
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
            'description': 'attendanceId',
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
