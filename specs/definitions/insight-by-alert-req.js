module.exports = [{
    name: 'insightByAlertReq',
    properties: {
        'employee': {
            'type': 'string'
        },
        'alert': {
            'type': 'string'
        },
        'date': {
            'type': 'string'
        },
        'onHome': {
            'type': 'boolean'
        },
        'statistics': {
            'type': 'object',
            'properties': {
                'count': {
                    'type': 'number'
                },
                'params': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'key': {
                                'type': 'string'
                            },
                            'value': {
                                'type': 'string'
                            },
                            'count': {
                                'type': 'number'
                            }
                        }
                    }
                }
            }
        },
        'alert': {
            'type': 'object',
            'properties': {
                'id': 'string',
                'config': {
                    'trigger': {
                        'type': 'object'
                    },
                    'processor': {
                        'type': 'object'
                    }
                }
            }
        },
        'alertTypes': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                },
                'name': {
                    'type': 'string'
                },
                'code': {
                    'type': 'string'
                },
                'description': {
                    'type': 'string'
                },
                'picUrl': {
                    'type': 'string'
                },
                'default': {
                    'type': 'boolean'
                },
                'processor': {
                    'type': 'object',
                    'properties': {
                        'parameters': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'id': {
                                        'type': 'string'
                                    },
                                    'name': {
                                        'type': 'string'
                                    },
                                    'type': {
                                        'type': 'string'
                                    },
                                    'title': {
                                        'type': 'string'
                                    },
                                    'description': {
                                        'type': 'string'
                                    }
                                }
                            }
                        }
                    }
                },
                'trigger': {
                    'type': 'object',
                    'properties': {
                        'parameters': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'id': {
                                        'type': 'string'
                                    },
                                    'name': {
                                        'type': 'string'
                                    },
                                    'type': {
                                        'type': 'string'
                                    },
                                    'title': {
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
        }
    }
}]
