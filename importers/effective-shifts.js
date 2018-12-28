const columnMaps = {
    default: [
        { key: 'employeeName', label: 'Name' },
        { key: 'employeeCode', label: 'Code' },
        { key: 'date', label: 'Date', type: Date },
        { key: 'shiftTypeCode', label: 'Shift Code' }
    ],
    week: [
        { key: 'employeeName', label: 'Name', col: 0 },
        { key: 'employeeCode', label: 'Code', col: 1 },
        { col: 2, headerType: Date },
        { col: 3, headerType: Date },
        { col: 4, headerType: Date },
        { col: 5, headerType: Date },
        { col: 6, headerType: Date },
        { col: 7, headerType: Date },
        { col: 8, headerType: Date }
    ]
}

exports.config = async (req, options) => {
    let format = options.format || 'default'

    if (!columnMaps[format]) {
        throw new Error(`'${format}' is not supported`)
    }

    return {
        sheet: 'Shifts',
        timeZone: req.context.config.timeZone,
        columnMap: columnMaps[format],
        modelMap: (row) => {
            if (!row.employeeCode) {
                return null
            }
            return {
                employee: {
                    code: row.employeeCode
                },
                date: row.date,
                shiftType: {
                    code: row.shiftTypeCode
                }
            }
        },
        headerRow: 2,
        keyCol: 1
    }
}
