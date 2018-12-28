module.exports = [{
    name: 'EmpRes',
    properties: {
        name: {
            type: 'string'
        },
        code: {
            type: 'string'
        },
        EmpDb_Emp_id: {
            type: 'string'
        },
        fingerPrint: {
            type: 'string'
        },
        devices: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }
}]
