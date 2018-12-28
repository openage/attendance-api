'use strict'
const sql = require('../db/sql')

const fromClause = (params, context) => {
    return `from 
    employees emp,
     organizations o`
}

const selectClause = (params, context) => {
    return `SELECT distinct
        emp.status,
        emp.name,
        emp.displayCode,
        emp.code,
        emp.fatherName,
        emp.dob,
        emp.bloodGroup,
        emp.phone,
        emp.email,
        emp.aadhaar,
        emp.pan,
        emp.employmentType,
        emp.doj,
        (select e.name as supervisorName from teamMembers t, employees e where t.SupervisorId = e.id and t.RegularEmployeeId = emp.id),
        (select e.code as supervisorCode from teamMembers t, employees e where t.SupervisorId = e.id and t.RegularEmployeeId = emp.id),
        (select designations.name as designationName from designations where id = emp.designationId),
        (select designations.code as designationCode from designations where id = emp.designationId),
        (select departments.name as departmentName from departments where id = emp.departmentId),
        (select departments.code as departmentCode from departments where id = emp.departmentId),
        emp.contractor,
        emp.dom,
        emp.address1,
        emp.address2,
        emp.city,
        emp.district,
        emp.state,
        emp.pincode,
        emp.accountNo,
        emp.accountHolder,
        emp.ifsc,
        emp.bank,
        emp.branch`
}

const whereClause = (params, context) => {
    // var whereBuilder = sql.whereBuilder()

    // whereBuilder.add('gender', params.gender, '=')
    // whereBuilder.add('doj', params.joiningDate, '=')
    // whereBuilder.add('contractor', params.contractor, '=')
    // return whereBuilder.build()

    return `
    where 
    emp.status = 'activate'
    and emp.organizationId=o.id
    and o.code = '${context.organization.code}'`
}

exports.headers = async (params, context) => {
    return [
        { label: 'Id', key: 'code' },
        { label: 'Code', key: 'displayCode' },
        { label: 'Name', key: 'name' },
        { label: 'Gender', key: 'gender' },
        { label: 'Father Name', key: 'fatherName' },
        { label: 'Birthday', key: 'dob' },
        { label: 'Blood Group', key: 'bloodGroup' },
        { label: 'Phone', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'Aadhaar', key: 'aadhaar' },
        { label: 'Type', key: 'employmentType' },
        { label: 'Joining Date', key: 'doj' },
        { label: 'Supervisor', key: 'supervisorName' },
        // { label: 'supervisorCode', key: 'supervisorCode' },
        { label: 'Designation', key: 'designationName' },
        // { label: 'designationCode', key: 'designationCode' },
        { label: 'Department', key: 'departmentName' },
        // { label: 'departmentCode', key: 'departmentCode' },
        { label: 'Contractor', key: 'contractor' },
        { label: 'Membership Date', key: 'dom' },
        { label: 'Line 1', key: 'address1' },
        { label: 'Line 2', key: 'address2' },
        { label: 'City', key: 'city' },
        { label: 'District', key: 'district' },
        { label: 'State', key: 'state' },
        { label: 'Postal Code', key: 'pincode' },
        { label: 'PAN', key: 'pan' },
        { label: 'Account No', key: 'accountNo' },
        { label: 'Account Holder', key: 'accountHolder' },
        { label: 'IFSC', key: 'ifsc' },
        { label: 'Bank', key: 'bank' },
        { label: 'Branch', key: 'branch' }
    ]
}

exports.data = async (params, context) => {
    let log = context.logger.start('getData')

    log.debug('fetching')
    let queryString = ` 
        ${selectClause(params, context)} 
        ${fromClause(params, context)} 
        ${whereClause(params, context)};`

    log.debug('query', queryString)
    let result = await sql.fetchPagedData(queryString)
    log.end()

    return result.items.map(item => {
        if (!item.displayCode) {
            item.displayCode = item.code
        }

        return item
    })
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
            align: 'center',
            border: null
        }
    }
    return {
        xlsx: {
            sheet: 'Employees',
            styles: {
                displayCode: { value: { border: null, font: { sz: '10', bold: true } } },
                name: {
                    width: 20.0,
                    value: { border: null, font: { sz: '10', bold: true } }
                },
                gender: medium,
                code: {
                    width: 12.0,
                    value: {
                        align: 'right',
                        border: null
                    }
                }
            },
            reportHeader: (sheet) => {
                // format
                sheet.merge({ col: 1, row: 1 }, { col: 28, row: 2 })
                sheet.width(1, 18)
                sheet.font(1, 1, { bold: 'true', sz: '20' })
                sheet.align(1, 1, 'center')
                sheet.border(1, 1, { left: 'thin', top: 'thin', right: 'thin', bottom: 'thin' })
                sheet.fill(1, 1, { type: 'solid', fgColor: '8', bgColor: '64' })

                // content
                sheet.set(1, 1, `${context.organization.name.toUpperCase()}`)

                return 2
            }
        }
    }
}
