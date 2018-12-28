
module.exports = [{
    name: 'insightRes',
    properties: {
        'id': {
            'type': 'string'
        },
        'status': {
            'type': 'string'
        },
        'organization': {
            'type': 'object',
            'properties': {
                'id': {
                    'type': 'string'
                }
            }
        },
        'config': {
            'type': 'object',
            'properties': {
                'processor': {
                    'type': 'object',
                    'properties': {
                        'channel': {
                            'type': 'string'
                        }
                    }
                },
                'trigger': {
                    'type': 'object',
                    'properties': {
                        'trigger': {
                            'type': 'object'
                        }
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
