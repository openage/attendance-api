const columnMaps = {

    default: [{
        key: 'employeeCode',
        label: 'Employee Code'
    }, {
        key: 'deviceName',
        label: 'Device'
    }, {
        key: 'status',
        label: 'Status'
    }]
}

exports.config = async (req, options) => {
    let format = options.format || 'default'

    if (!columnMaps[format]) {
        throw new Error(`'${format}' is not supported`)
    }
    return {
        sheet: 'Biometric',
        timeZone: req.context.config.timeZone,
        columnMap: columnMaps[format],
        modelMap: (row) => {
            return row
        },
        headerRow: 0,
        keyCol: 0
    }
}
