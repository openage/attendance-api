'use strict'
const jimp = require('jimp')

exports.thumbnailFromUrl = (url) => {
    if (!url) {
        return Promise.resolve(null)
    }

    return new Promise((resolve, reject) => {
        return jimp.read(url).then(function (lenna) {
            if (!lenna) {
                return resolve(null)
            }
            var a = lenna.resize(15, 15) // resize
                .quality(50) // set JPEG quality
                .getBase64(jimp.MIME_JPEG, function (result, base64, src) {
                    return resolve(base64)
                })
        }).catch(function (err) {
            reject(err)
        })
    })
}
