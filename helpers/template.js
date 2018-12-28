'use strict'
const handlebars = require('handlebars')
const moment = require('moment')

handlebars.registerHelper('date', function (date) {
    if (!date) {
        return ''
    }
    return moment(date).format('DD-MM-YYYY')
})

handlebars.registerHelper('time', function (date) {
    if (!date) {
        return ''
    }
    return moment(date).format('hh:mm:ss')
})

handlebars.registerHelper('minhrsConversion', function (mins) {
    if (!mins) {
        return ''
    }

    let text
    if (mins >= 60) {
        if (mins === 60) {
            text = `1 hours`
        }

        let rem = mins % 60
        let hrs = (mins - rem) / 60
        text = `${hrs} hours ${rem} minutes`
    } else {
        text = `${mins} minutes`
    }

    return text
})

handlebars.registerHelper('attendanceStatus', function (status) {
    let modifiedStatus = status
    if (status) {
        switch (status.toLowerCase()) {
        case 'missswipe':
            modifiedStatus = 'Missed Swipe'
            break
        default:
            modifiedStatus = status
            // insert a space before all caps
                .replace(/([A-Z])/g, ' $1')
            // uppercase the first character
                .replace(/^./, function (str) { return str.toUpperCase() })
            break
        }
    }

    return modifiedStatus
})

handlebars.registerHelper('ge', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a >= b) ? next.fn(this) : next.inverse(this)
})

// greater than
handlebars.registerHelper('gt', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a > b) ? next.fn(this) : next.inverse(this)
})

// equal
handlebars.registerHelper('eq', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a === b) ? next.fn(this) : next.inverse(this)
})

// less than
handlebars.registerHelper('lt', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a < b) ? next.fn(this) : next.inverse(this)
})

// not equal
handlebars.registerHelper('ne', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a !== b) ? next.fn(this) : next.inverse(this)
})

exports.formatter = function (format) {
    var template = handlebars.compile(format)
    return {
        inject: function (data) {
            return template(data)
        }
    }
}
