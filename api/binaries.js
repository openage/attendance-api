'use strict'
const path = require('path')
const archiver = require('archiver')
const fs = require('fs')
const join = require('path').join

exports.get = (req, res) => {
    let filename = req.params.filename
    let activationKey = filename.slice(filename.indexOf('_') + 1, filename.indexOf('.'))
    res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=setup.zip'
    })

    var zip = archiver('zip')
    zip.pipe(res)
    fs.readdirSync(join(__dirname, '../bin/debug'))
        .forEach(function (file) {
            let actualName
            if (file === 'SyncSetup.exe') {
                actualName = `SyncSetup_${activationKey}.exe`
            }
            if (file === 'SyncSetup.exe.config') {
                actualName = `SyncSetup_${activationKey}.exe.config`
            }
            zip.file(join(__dirname, '../bin/debug/', file), { name: actualName || file })
        })
    zip.finalize()
}
