module.exports = [{
    url: '/',
    post: {
        summary: 'Create Tasks',
        description: 'Craate task for device configurations',
        parameters: [{
            name: 'body',
            description: 'Task details',
            required: true,
            schema: {
                $ref: '#/definitions/taskReq'
            }
        }, {
            name: 'x-access-token',
            in: 'header',
            description: 'x-access-token here',
            required: true
        }],
        responses: {
            default: {
                description: 'Unexpected error',
                schema: {
                    $ref: '#/definitions/taskReq'
                }
            }
        }
    },
    get: {
        summary: 'get tasks list',
        description: 'get tasks list for device configurations',
        parameters: [{
            name: 'from',
            in: 'query',
            description: 'from date here',
            required: false
        },
        {
            name: 'device',
            in: 'query',
            description: 'device id here',
            required: false
        },
        {
            name: 'x-access-token',
            in: 'header',
            description: 'x-access-token here',
            required: true
        }
        ],
        responses: {
            default: {
                description: 'Unexpected error',
                schema: {
                    $ref: '#/definitions/taskPageRes'
                }
            }
        }
    }
}, {
    url: '/{id}',
    get: {
        summary: 'Get tasks',
        description: 'get tasks',
        parameters: [{
            name: 'id',
            in: 'path',
            description: 'task id here',
            required: true
        }, {
            name: 'x-access-token',
            in: 'header',
            description: 'x-access-token here',
            required: true
        }],
        responses: {
            default: {
                description: 'Unexpected error',
                schema: {
                    $ref: '#/definitions/taskReq'
                }
            }
        }
    },
    put: {
        summary: 'update task',
        description: 'update task status',
        parameters: [{
            name: 'id',
            in: 'path',
            description: 'task id here',
            required: true
        },
        {
            name: 'x-access-token',
            in: 'header',
            description: 'x-access-token here',
            required: true
        },
        {
            name: 'body',
            description: 'update status details',
            required: true,
            schema: {
                $ref: '#/definitions/taskUpdateReq'
            }
        }
        ],
        responses: {
            default: {
                description: 'Unexpected error',
                schema: {
                    $ref: '#/definitions/taskReq'
                }
            }
        }
    }
}]
