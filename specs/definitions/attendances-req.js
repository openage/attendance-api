
module.exports = [{
    name: 'attendancesReq',
    properties: {
        'checkIn': {
            'type': 'string'
        },
        'checkOut': {
            'type': 'string'
        },
        'hoursWorked': {
            'type': 'integer'
        },
        'employee': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                }
            }
        }
    }
}]
