module.exports = [{
    name: 'taskPageRes',
    properties: {
        items: {
            type: 'array',
            items: {
                type: 'object',
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
            }
        }
    }
}]
