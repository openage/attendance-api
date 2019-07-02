/* eslint-disable indent */
'use strict'
const sql = require('../db/sql')
const dates = require('../../../helpers/dates')
const _ = require('underscore')
const moment = require('moment')
const db = require('../../../helpers/mongodb').db('directory')

const extractQuery = (params, context) => {
    let query = {
        'status': 'active',
        'organization': global.toObjectId(context.employee.organization.externalId)
    }
    if (params.employee) {
        if (params.employee.employeeStatus) {
            let employeeStatusList = []
            let queryEmployeeStatusList = params.employee.employeeStatus
            _.each(queryEmployeeStatusList, (employeeStatus) => {
                employeeStatusList.push(employeeStatus.code.toLowerCase())
            })
            query['status'] = {
                $in: employeeStatusList
            }
        }

        if (params.employee.name) {
            query['profile.firstName'] = {
                $regex: '^' + params.employee.name,
                $options: 'i'
            }
        }

        if (params.employee.code) {
            query['code'] = {
                $regex: params.employee.code,
                $options: 'i'
            }
        }

        if (params.employee.biometricId) {
            query['config.biometricCode'] = {
                $regex: params.employee.biometricId,
                $options: 'i'
            }
        }

        if (params.employee.supervisor) {
            query['supervisor'] = global.toObjectId(params.employee.supervisor.id)
        }

        if (params.employee.userTypes) {
            let userTypesList = []
            let queryUserTypesList = params.employee.userTypes
            _.each(queryUserTypesList, (userType) => {
                userTypesList.push(userType.code.toLowerCase())
            })
            query['type'] = {
                $in: userTypesList
            }
        }

        if (params.employee.employeeTypes) {
            let employeeTypesList = []
            let queryEmployeeTypesList = params.employee.employeeTypes
            _.each(queryEmployeeTypesList, (employeeType) => {
                employeeTypesList.push(employeeType.code.toLowerCase())
            })
            query['config.employmentType'] = {
                $in: employeeTypesList
            }
        }

        if (params.employee.departments) {
            let departmentList = []
            let queryDepartmentList = params.employee.departments
            _.each(queryDepartmentList, (department) => {
                departmentList.push(global.toObjectId(department.id))
            })
            query['department'] = {
                $in: departmentList
            }
        }
        if (params.employee.divisions) {
            let divisionList = []
            let queryDivisionList = params.employee.divisions
            _.each(queryDivisionList, (division) => {
                divisionList.push(global.toObjectId(division.id))
            })
            query['division'] = {
                $in: divisionList
            }
        }

        if (params.employee.designations) {
            let designationList = []
            let queryDesignationList = params.employee.designations
            _.each(queryDesignationList, (designation) => {
                designationList.push(global.toObjectId(designation.id))
            })
            query['designation'] = {
                $in: designationList
            }
        }

        if (params.employee.contractors) {
            let contractorList = []
            let queryContractorsList = params.employee.contractors
            _.each(queryContractorsList, (contractor) => {
                contractorList.push(contractor.code)
            })
            query['config.contractor.code'] = {
                $in: contractorList
            }
        }
    }
    if (params.dates) {
        if (params.dates.joiningDate) {
            let from = moment(params.dates.joiningDate).startOf('day').toDate()
            let till = moment(params.dates.joiningDate).endOf('day').toDate()
            query['doj'] = {
                $gte: from,
                $lte: till
            }
        }
    }
    return query
}
//         if (params.dates) {
//             if (params.dates.joiningDate) {
//                 let bod = dates.date(params.dates.joiningDate).eod()
//                 let eod = dates.date(params.dates.joiningDate).eod()
//                 whereBuilder.add('emp.doj', moment(bod).format('YYYY-MM-DD 00:00:00'), '>=')
//                 whereBuilder.add('emp.doj', moment(eod).add(1, 'day').format('YYYY-MM-DD 00:00:00'), '<')
//             }
//         }

exports.data = async (params, context) => {
    let query = extractQuery(params, context)
    let finder = [{
            $match: query
        },
        {
            $lookup: {
                from: 'departments',
                localField: 'department',
                foreignField: '_id',
                as: 'department'
            }
        }, {
            $unwind: '$department'
        }, {
            $lookup: {
                from: 'designations',
                localField: 'designation',
                foreignField: '_id',
                as: 'designation'
            }
        }, {
            $unwind: '$designation'
        },
        {
            $lookup: {
                from: 'divisions',
                localField: 'division',
                foreignField: '_id',
                as: 'division'
            }
        }, {
            $unwind: '$division'
        }, {
            $lookup: {
                from: 'contractors',
                localField: 'config.contractor.code',
                foreignField: 'code',
                as: 'contractor'
            }
        }, {
            $unwind: '$contractor'
        }
        // , {
        //     $lookup: {
        //         from: 'employees',
        //         localField: 'supervisor',
        //         foreignField: '_id',
        //         as: 'supervisor'
        //     }
        // }, {
        //     $unwind: '$supervisor'
        // }
        //      {
        //         $group: {
        //             _id: '$_id',
        //             status: {
        //                 $first: '$status'
        //             },
        //             department: {
        //                 $first: '$dept'
        //             },
        //             designation: {
        //                 $first: '$des'
        //             },
        //             division: {
        //                 $first: '$div'
        //             },
        //             contractor: {
        //                 $first: '$cont'
        //             }
        //         }
        //     }
    ]

    let items = await db.collection('employees').aggregate(finder).catch(err => {
        console.log(err)
    })

    console.log(items)

    return items.map(item => {
        let serialNo = 0
        let model = {
            serialNo: serialNo++,
            code: item.code,
            biometricCode: item.config && item.config.biometricCode ? item.config.biometricCode : '',
            firstName: item.profile && item.profile.firstName ? item.profile.firstName : '',
            lastName: item.profile && item.profile.lastName ? item.profile.lastName : '',
            gender: item.profile && item.profile.gender ? item.profile.gender : '',
            fatherName: item.profile && item.profile.fatherName ? item.profile.fatherName : '',
            dob: item.profile && item.profile.dob ? dates.date(item.profile.dob).toString('DD/MM/YYYY') : '',
            bloodGroup: item.profile && item.profile.bloodGroup ? item.profile.bloodGroup : '',
            phone: (item.phone).toString() | '',
            email: item.email | '',
            aadhaar: item.config && item.config.aadhaar ? item.config.aadhaar : '',
            doj: item.doj ? dates.date(item.doj).toString('DD/MM/YYYY') : '',
            designationName: item.designation && item.designation.name ? item.designation.name : '',
            departmentName: item.department && item.department.name ? item.department.name : '',
            divisionName: item.division && item.division.name ? item.division.name : '',
            employmentType: item.config && item.config.employmentType ? item.config.employmentType : '',
            userType: item.type ? item.type : '',
            contractor: item.contractor && item.contractor.name ? item.contractor.name : '',
            dom: item.config && item.config.dom ? dates.date(item.config.dom).toString('DD/MM/YYYY') : '',
            address1: item.address && item.address.line1 ? item.address.line1 : '',
            address2: item.address && item.address.line2 ? item.address.line2 : '',
            city: item.address && item.address.city ? item.address.city : '',
            district: item.address && item.address.district ? item.address.district : '',
            state: item.address && item.address.state ? item.address.state : '',
            // country: item.address && item.address.country ? item.address.country : '',
            pinCode: item.address && item.address.pinCode ? item.address.pinCode : '',
            pan: item.config && item.config.pan ? item.config.pan : '',
            accountNo: item.config && item.config.accountNo ? item.config.accountNo : '',
            accountHolder: item.config && item.config.accountHolder ? item.config.accountHolder : '',
            ifsc: item.config && item.config.ifsc ? item.config.ifsc : '',
            bank: item.config && item.config.bank ? item.config.bank : '',
            branch: item.config && item.config.branch ? item.config.branch : '',
            uan: item.config && item.config.uan ? item.config.uan : '',
            esi: item.config && item.config.esi ? item.config.esi : '',
            pf: item.config && item.config.pf ? item.config.pf : '',
            nomineeName: item.config && item.config.nominee ? item.config.nominee.name : '',
            nomineeRelation: item.config && item.config.nominee ? item.config.nominee.relation : ''
            // status: item.status || ''

        }
        return model
    })
}
exports.headers = async (params, context) => {
    return [{
            label: 'Code',
            key: 'code'
        },
        {
            label: 'Biometric Code',
            key: 'biometricCode'
        },
        {
            label: 'Joining Date',
            key: 'doj'
        },
        {
            label: 'User Type',
            key: 'userType'
        },
        {
            label: 'First Name',
            key: 'firstName'
        },
        {
            label: 'Last Name',
            key: 'lastName'
        },
        {
            label: 'Gender',
            key: 'gender'
        },
        {
            label: 'Birthday',
            key: 'dob'
        },
        {
            label: 'Blood Group',
            key: 'bloodGroup'
        },
        {
            label: 'Father Name',
            key: 'fatherName'
        },
        {
            label: 'Phone',
            key: 'phone'
        },
        {
            label: 'Email',
            key: 'email'
        },
        {
            label: 'Aadhaar',
            key: 'aadhaar'
        },
        // {
        //     label: 'Supervisor',
        //     key: 'supervisorName'
        // },
        // { label: 'supervisorCode', key: 'supervisorCode' },
        {
            label: 'Designation',
            key: 'designationName'
        },
        // { label: 'designationCode', key: 'designationCode' },
        {
            label: 'Department',
            key: 'departmentName'
        },
        // { label: 'departmentCode', key: 'departmentCode' },
        {
            label: 'Division',
            key: 'divisionName'
        },
        {
            label: 'Employment Type',
            key: 'employmentType'
        },

        {
            label: 'Contractor',
            key: 'contractor'
        },
        {
            label: 'Membership Date',
            key: 'dom'
        },
        {
            label: 'Line 1',
            key: 'address1'
        },
        {
            label: 'Line 2',
            key: 'address2'
        },
        {
            label: 'City',
            key: 'city'
        },
        {
            label: 'District',
            key: 'district'
        },
        {
            label: 'State',
            key: 'state'
        },
        {
            label: 'Postal Code',
            key: 'pinCode'
        },
        {
            label: 'PAN',
            key: 'pan'
        },
        {
            label: 'Account No',
            key: 'accountNo'
        },
        {
            label: 'Account Holder',
            key: 'accountHolder'
        },
        {
            label: 'IFSC',
            key: 'ifsc'
        },
        {
            label: 'Bank',
            key: 'bank'
        },
        {
            label: 'Branch',
            key: 'branch'
        },
        {
            label: 'UAN',
            key: 'uan'
        },
        {
            label: 'ESI',
            key: 'esi'
        }, {
            label: 'PF',
            key: 'pf'
        }, {
            label: 'Nominee Name',
            key: 'nomineeName'
        },
        {
            label: 'Nominee Relation',
            key: 'nomineeRelation'
        }
    ]
}

exports.format = async (params, context) => {
    let narrow = {
        width: 5.0,
        value: {
            align: 'center',
            border: null
        }
    }
    let wide = {
        width: 20.0
    }

    let medium = {
        width: 8.0,
        value: {
            align: 'center'
        }
    }
    return {
        xlsx: {
            sheet: 'Employees',
            styles: {
                code: {
                    value: {
                        border: null,
                        font: {
                            sz: '10',
                            bold: true
                        },
                        align: 'center'
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
                gender: medium,
                displayCode: {
                    width: 12.0,
                    value: {
                        align: 'right',
                        border: null
                    }
                }
            },
            reportHeader: (sheet) => {
                // format
                sheet.merge({
                    col: 1,
                    row: 1
                }, {
                    col: 28,
                    row: 2
                })
                sheet.width(1, 30)
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
