module.exports = [{
    name: 'taskReq',
    properties: {
        device: {
            type: 'string'
        },
        action: {
            type: 'string'
        },
        date: {
            type: 'string'
        },
        employee: {
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                code: {
                    type: 'string'
                }
            }
        },
        status: {
            type: 'string'
        }
    }
}]
