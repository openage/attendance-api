const csv = require('fast-csv')

const fs = require('fs')

const moment = require('moment')

const mapper = (row, context) => {
    let dateInput = row.Date || row.date

    if (!dateInput.endsWith('Z')) {
        dateInput = `${dateInput} ${context.config.timeZone}`
    }
    let date

    if (moment(dateInput, 'DD-MM-YYYY').isValid()) {
        date = moment(dateInput, 'DD-MM-YYYY').toDate()
    } else if (moment(dateInput, 'YYYY-MM-DD').isValid()) {
        date = moment(dateInput, 'YYYY-MM-DD').toDate()
    }

    return {
        date: date,
        days: row.Days || row.days,
        employee: {
            code: row.code || row.Code
        },
        type: {
            code: row.leave || row.Leave
        },
        reason: row.reason || row.Reason,
        status: (row.status || row.Status || 'approved').toLowerCase()
    }
}

exports.import = async (req, file) => {
    const items = []
    let stream = fs.createReadStream(file.path)

    return new Promise((resolve, reject) => {
        csv.fromStream(stream, { headers: true, ignoreEmpty: true })
            .on('data', (row) => {
                items.push(mapper(row, req.context))
            })
            .on('end', () => {
                return resolve(items)
            })
    })
}
