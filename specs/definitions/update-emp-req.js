module.exports = [{
    name: 'updateEmpReq',
    properties: {
        'name': {
            'type': 'string'
        },
        'code': {
            'type': 'string'
        },
        'shiftType': {
            'type': 'string'
        },
        'effectiveShift': {
            'type': 'object',
            'properties': {
                'shiftType': {
                    'type': 'string'
                },
                'date': {
                    'type': 'string'
                }
            }
        }
    }
}]
