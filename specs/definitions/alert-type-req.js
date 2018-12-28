
module.exports = [{
    name: 'alertTypeReq',
    properties: {
        'name': {
            'type': 'string'
        },
        'code': {
            'type': 'string'
        },
        'default': {
            'type': 'boolean'
        },
        'description': {
            'type': 'string'
        },
        'picUrl': {
            'type': 'string'
        },
        'hasInsights': {
            'type': 'boolean'
        },
        'hasNotifications': {
            'type': 'boolean'
        },
        'cost': {
            'type': 'string'
        },
        'channels': {
            'type': 'array',
            'items': {
                'type': 'string'
            }
        },
        'trigger': {
            'type': 'object',
            'properties': {
                'entity': {
                    'type': 'string'
                },
                'action': {
                    'type': 'string'
                },
                'parameters': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'name': {
                                'type': 'string'
                            },
                            'title': {
                                'type': 'string'
                            },
                            'type': {
                                'type': 'string'
                            },
                            'description': {
                                'type': 'string'
                            },
                            'alertTypeReq': {
                                'type': 'array',
                                'items': {
                                    'type': 'string'
                                }
                            }
                        }
                    }
                }
            }
        },
        'processor': {
            'type': 'object',
            'properties': {
                'name': {
                    'type': 'string'
                },
                'parameters': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'name': {
                                'type': 'string'
                            },
                            'title': {
                                'type': 'string'
                            },
                            'type': {
                                'type': 'string'
                            },
                            'description': {
                                'type': 'string'
                            }
                        }
                    }
                }
            }
        }
    }
}]
