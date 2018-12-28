const excelBuilder = require('msexcel-builder')
const fsConfig = require('config').get('folders')
const appRoot = require('app-root-path')

const defaultHeaderStyle = {
    width: 12.0,
    border: {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    },
    font: { sz: '10', bold: true },
    align: 'center'
}

const defaultValueStyle = {
    width: 12.0,
    border: {
        left: 'thin',
        top: 'thin',
        right: 'thin',
        bottom: 'thin'
    },
    font: { sz: '10' },
    align: 'left'
}

const setStyle = (style, defaultStyle) => {
    style = style || {}
    if (style.width === undefined) {
        style.width = defaultStyle.width
    }

    if (style.border === undefined) {
        style.border = defaultStyle.border
    }

    if (style.font === undefined) {
        style.font = defaultStyle.font
    }

    if (style.align === undefined) {
        style.align = defaultStyle.align
    }

    return style
}

exports.newWorkbook = fileName => {
    let dir = fsConfig.temp || `${appRoot}/temp/`

    let workbook = excelBuilder.createWorkbook(dir, fileName)
    let sheet

    const createSheet = (name, columns, rows) => {
        sheet = workbook.createSheet(name, columns, rows)
        return sheet
    }

    return {
        workbook: workbook,
        createSheet: createSheet,
        sheet: sheet,
        save: () => {
            return new Promise((resolve, reject) => {
                workbook.save(function (err) {
                    if (!err) {
                        return resolve({
                            fileName: fileName,
                            dir: dir,
                            path: `${dir}/${fileName}`
                        })
                    }
                    workbook.cancel()
                    return reject(err)
                })
            })
        }
    }
}

exports.setHeader = (sheet, row, headers) => {
    headers.forEach(header => {
        sheet.width(header.col, header.style.width)
        sheet.font(header.col, row, header.style.font)
        sheet.align(header.col, row, header.style.align)
        sheet.border(header.col, row, header.style.border)
        sheet.set(header.col, row, header.label)
    })

    return row
}

exports.setValue = (sheet, row, header, item) => {
    if (header.style.value.font) {
        sheet.font(header.col, row, header.style.value.font)
    }

    if (header.style.value.align) {
        sheet.align(header.col, row, header.style.value.align)
    }

    if (header.style.value.border) {
        sheet.border(header.col, row, header.style.value.border)
    }

    if (item[header.key]) {
        sheet.set(header.col, row, item[header.key])
    }
}

exports.buildHeaders = (items, styles) => {
    styles = styles || {}
    let headerStyle = setStyle(styles.headers, defaultHeaderStyle)
    let valueStyle = setStyle(styles.values, defaultValueStyle)

    let headers = []
    let col = 1
    items.forEach(header => {
        if (typeof header === 'string') {
            header = {
                label: header,
                key: header
            }
        }
        if (!header.label) {
            header.label = header.key
        }
        header.col = col

        header.style = styles[header.key] || {}
        if (header.style.width === undefined) {
            header.style.width = headerStyle.width
        }
        if (header.style.font === undefined) {
            header.style.font = headerStyle.font
        }
        if (header.style.align === undefined) {
            header.style.align = headerStyle.align
        }
        if (header.style.border === undefined) {
            header.style.border = headerStyle.border
        }

        header.style.value = header.style.value || {}
        if (header.style.value.width === undefined) {
            header.style.value.width = valueStyle.width
        }
        if (header.style.value.font === undefined) {
            header.style.value.font = valueStyle.font
        }

        if (header.style.value.align === undefined) {
            header.style.value.align = valueStyle.align
        }
        if (header.style.value.border === undefined) {
            header.style.value.border = valueStyle.border
        }
        headers.push(header)
        col = col + 1
    })

    return headers
}
