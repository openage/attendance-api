'use strict'
// eslint-disable-next-line no-extend-native
Number.prototype.padding = function (digit) {
    if (digit >= 10) {
        return digit.toString()
    } else {
        return '0' + digit.toString()
    }
}
