'use strict'

exports.getLeaveKind = (leave) => {
    // todo: handle two-third scenario 0.6

    switch (leave.days) {
    case 0.3 :
        return 'one-third day'
    case 0.5 :
        return 'half day'
    case 1 :
        return 'full day'
    default:
        return 'multiple days'
    }
}
