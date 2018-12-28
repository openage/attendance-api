'use strict'

const moment = require('moment')

let period = function period () {
    return moment().toDate()
}

let Period = new period()

period.prototype.setHourAndMinute = (date) => {
    return moment()
        .set('hour', moment(date).hours())
        .set('minute', moment(date).minutes())
        .set('second', 0)
        .set('millisecond', 0).toDate()
}
global.period = period
