module.exports = [{
    name: 'shiftTypesReq',
    properties: {
        'name': {
            'type': 'string'
        },
        'code': {
            'type': 'string'
        },
        'unitsPerDay': {
            'type': 'integer'
        },
        'startTime': {
            'type': 'string'
        },
        'endTime': {
            'type': 'string'
        },
        'grace': {
            'checkIn': {
                'early': {
                    'type': 'number'
                },
                'late': {
                    'type': 'number'
                }
            },
            'checkOut': {
                'early': {
                    'type': 'number'
                },
                'late': {
                    'type': 'number'
                }
            }
        },
        'breakTime': {
            'type': 'number'
        },

        'monday': {
            'type': 'string'
        },
        'tuesday': {
            'type': 'string'
        },
        'wednesday': {
            'type': 'string'
        },
        'thursday': {
            'type': 'string'
        },
        'friday': {
            'type': 'string'
        },
        'saturday': {
            'type': 'string'
        },
        'sunday': {
            'type': 'string'
        }
    }
}]
