module.exports = [{
    name: 'fingerPrintRes',
    properties: {
        marks: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        status: {
            type: 'string'
        },
        employee: {
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                }
            }
        }
    }
}]
