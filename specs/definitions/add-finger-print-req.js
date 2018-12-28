module.exports = [{
    name: 'addFingerPrintReq',
    properties: {
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
