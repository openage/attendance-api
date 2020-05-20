module.exports = [{
    url: '/extractor',
    get: {
        'summary': 'Extract Attendances',
        'description': 'Extract Attendances',
        'parameters': [{
            'name': 'ofDate',
            'in': 'query',
            'description': 'send UTC'
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
    url: '/getOneDayAttendances',
    get: {
        'summary': 'One Day Attendances',
        'description': 'One Day Attendances',
        'parameters': [{
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
            'name': 'fromDate',
            'in': 'query',
            'description': 'send UTC',
            'required': true
        }, {
            'name': 'toDate',
            'in': 'query',
            'description': 'send UTC'
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
        'parameters': [],
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
        'summary': 'Get your attendances',
        'description': 'get your attendances',
        'parameters': [{
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
        'summary': 'Get summary attendance',
        'description': 'get summary attendance',
        'parameters': [{
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
        'summary': 'Get attendance by id',
        'description': 'get attendance by id',
        'parameters': [{
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
        'summary': 'Update attendance by id',
        'description': 'Update attendance by id',
        'parameters': [{
            'name': 'body',
            'in': 'body',
            'description': 'alerts details',
            'required': true,
            'schema': {
                '$ref': '#/definitions/attendanceReq'
            }
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
        'summary': 'Get attendance summary',
        'description': 'get attendance summary',
        'parameters': [{
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
        'summary': 'Get team attendance summary',
        'description': 'get team attendance summary',
        'parameters': [],
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
        'description': 'Get Employee Location corresponding to attendanceId',
        'parameters': [{
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
        'description': 'Get Employee Location corresponding to attendanceId',
        'parameters': [{
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
