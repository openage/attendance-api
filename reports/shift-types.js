/* eslint-disable indent */
'use strict'
const db = require('../models')
const dates = require('../helpers/dates')
const shiftTypes = require('../services/shift-types')

const extractQuery = (params, context) => {
    let queryModel = {}
    queryModel = {
        'organization': global.toObjectId(context.organization.id),
        status: {
            $ne: 'inactive'
        }
    }
    if (params.employee) {
        if (params.employee.departments) {
            let departmentList = []
            let queryDepartmentList = params.employee.departments
            departmentList = queryDepartmentList.map(item => item.name)
            queryModel['department'] = {
                $in: departmentList
            }
        }
    }
    return queryModel
}

exports.data = async (params, context) => {
    let query = extractQuery(params, context)
    let model = {
        department: query.department,
        organization: query.organization,
        status: query.status
    }
    let shiftType = await shiftTypes.search(model, context)
    shiftType = shiftType.sort({
        department: 1
    })

    let serialNo = 0
    return shiftType.map(item => {
        let model = {
            serialNo: ++serialNo,
            department: item.department ? item.department : 'Shared',
            name: item.name,
            code: item.code,
            startTime: dates.date(item.startTime).toString('hh:mm a'),
            endTime: dates.date(item.endTime).toString('hh:mm a'),
            breakTime: item.breakTime
        }
        return model
    })
}

exports.headers = async (params, context) => {
    return context.getConfig('reports.shift-type.columns') || [{
            label: 'S.No.',
            key: 'serialNo'
        },
        {
            label: 'Department',
            key: 'department'
        },
        {
            label: 'Code',
            key: 'code'
        },
        {
            label: 'Name',
            key: 'name'
        },
        {
            label: 'Start Time',
            key: 'startTime'
        },
        {
            label: 'End Time',
            key: 'endTime'
        }
    ]
}

exports.format = async (params, context) => {
    return {
        xlsx: {
            sheet: context.getConfig('reports.shift-types.format.xlsx.sheet') || 'Shift Types',
            styles: context.getConfig('reports.shift-types.format.xlsx.styles') || {
                headers: {},
                values: {},
                serialNo: {
                    width: 5.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        },
                        align: 'center'
                    }
                },
                code: {
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                name: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                startTime: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                endTime: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                },
                department: {
                    width: 20.0,
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        }
                    }
                }
            },
            reportHeader: (sheet) => {
                sheet.merge({
                    col: 1,
                    row: 1
                }, {
                    col: 6,
                    row: 2
                })
                sheet.width(1, 6)
                sheet.font(1, 1, {
                    bold: 'true',
                    sz: '20'
                })
                sheet.align(1, 1, 'center')
                sheet.border(1, 1, {
                    left: 'thin',
                    top: 'thin',
                    right: 'thin',
                    bottom: 'thin'
                })
                sheet.fill(1, 1, {
                    type: 'solid',
                    fgColor: '8',
                    bgColor: '64'
                })

                // content
                sheet.set(1, 1, `${context.organization.name.toUpperCase()}`)

                return 2
            }
        }
    }
}
