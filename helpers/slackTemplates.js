'use strict'

exports.getTemplates = (data, templateCode) => {
    switch (templateCode) {
    // for comming late alert

    case 'send-slack-for-minutes-late':
        return {
            message: `${data.name} has come late by ${data.text}`,
            emoji: ``
        }

    case 'send-slack-for-late-noOfTimes':
        return {
            message: `${data.name} has come late ${data.count} times \nin this Month`,
            emoji: ``
        }

    case 'send-slack-for-late-inRow':
        return {
            message: `${data.name} has come late ${data.count} times in row \nin this Month`,
            emoji: ``
        }

        // for going early alert

    case 'send-slack-for-minutes-early-going':
        return {
            message: `${data.name} has left office by ${data.text}`,
            emoji: ``
        }

    case 'send-slack-for-goingEarly-noOfTimes':
        return {
            message: `${data.name} is going early ${data.count} Times \nin current Month`,
            emoji: ``
        }

    case 'send-slack-for-goingEarly-inRow':
        return {
            message: `${data.name} has gone early  ${data.count} Times in Row \ncurrent Month`,
            emoji: ``
        }

        // for leave submission
    case 'send-slack-for-leave-submission':
        return {
            message: `${data.employee} has applied leave ${data.text}`,
            emoji: `:bow:`
        }

        // for leave reject
    case 'send-slack-for-leave-reject':
        return {
            message: `${data.employee}, your leave request of ${data.leaveDate} \nhas been rejected by ${data.supervisor}`,
            emoji: `:crying_cat_face:`
        }

        // for leave approve
    case 'send-slack-for-leave-approve':
        return {
            message: `${data.employee}, your leave request of ${data.leaveDate} \nhas been accepted by ${data.supervisor}`,
            emoji: `:tada:`
        }

        // on leave
    case 'send-slack-on-reportee-leave':
        return {
            message: `${data.employee}, was on leave on ${data.day}.`,
            emoji: `:tada:`
        }

    default:
        return ''
    }
}
