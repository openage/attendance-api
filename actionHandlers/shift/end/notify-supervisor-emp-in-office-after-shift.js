let cron = require('cron').CronJob
const moment = require('moment')
const logger = require('@open-age/logger')('employeeAfterShift')
const async = require('async')
const communications = require('../../../services/communications')
const entities = require('../../../helpers/entities')
const db = require('../../../models')

const _ = require('underscore')

let sendNotification = (emp, supervisorLevel, channels, context, template, extraText) => {
    communications.send({
        employee: emp,
        level: supervisorLevel
    }, {
        actions: ['call'],
        entity: entities.toEntity(emp, 'employee'),
        data: {
            phone: emp.phone || null,
            employee: emp,
            genderText: (emp.gender && emp.gender.toLowerCase() == 'female') ? 'her' : 'him',
            extraText: extraText
        },
        template: template
    }, channels, context)
}

var start = (data, alert, context, shiftType) => {
    let gender = 'both'

    let supervisorLevel = 1
    let channels = ['push']
    let ifWomanIsAlone = false
    let noOfMinutes = 60
    let noOfLateDays = 3

    if (alert.config.trigger) {
        gender = alert.config.trigger.gender ? alert.config.trigger.gender : gender
        ifWomanIsAlone = alert.config.trigger.ifWomanIsAlone ? (alert.config.trigger.ifWomanIsAlone == 'yes') : false
        noOfMinutes = alert.config.trigger.hours ? alert.config.trigger.noOfMinutes : noOfMinutes
        noOfLateDays = alert.config.trigger.noOfLateDays ? alert.config.trigger.noOfLateDays : noOfLateDays
    }

    if (alert.config.processor) {
        supervisorLevel = alert.config.processor.level || supervisorLevel
        if (alert.config.processor.channel) {
            channels.push(alert.config.processor.channel)
        }
    }

    async.waterfall([
        (cb) => {
            let query = {
                'emp.organization': global.toObjectId(context.organization.id),
                'emp.shiftType': global.toObjectId(shiftType.id),
                checkIn: {
                    $exists: true,
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate()
                },
                status: /checkedIn|checked-in-again/
            }

            if (gender != 'both') { query['emp.gender'] = gender }

            db.attendance.aggregate([{
                $lookup: {
                    from: 'employees',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'emp'
                }
            },
            {
                $match: query
            }
            ]).then((result) => {
                async.eachSeries(result, (item, next) => {
                    db.attendance.find({
                        employee: item.employee,
                        checkOut: {
                            $exists: true,
                            $gte: moment().startOf('month').toDate(),
                            $lt: moment().endOf('day').subtract(1, 'day').toDate()
                        }
                    }).populate({
                        path: 'shift',
                        populate: {
                            path: 'shiftType'
                        }
                    }).then(attendances => {
                        let extraText = ''
                        let att = _.filter(attendances, (item) => {
                            let endTime = moment(item.shift.shiftType.endTime)
                            let shiftEndTime = moment(item.shift.date)
                                .set('hour', endTime.hour())
                                .set('minute', endTime.minute())
                                .set('second', endTime.second())
                                .set('millisecond', 0)
                            return moment(item.checkOut) > shiftEndTime && moment(item.checkOut).diff(shiftEndTime, 'minutes') >= noOfMinutes
                        })

                        if (att && att.length >= noOfLateDays) { extraText = `${item.emp[0].name} is staying ${att.length} time late in last ${moment().diff(moment().startOf('month'), 'days')} days.` }

                        sendNotification(item.emp[0], supervisorLevel, channels, context, 'still-in-office-after-shift', extraText)
                        next()
                    }).catch(err => {
                        console.log(err)
                        next()
                    })
                }, (err) => {
                    return cb(err)
                })

                // if woman is alone

                let femaleEmps = _.filter(result, (item) => {
                    return item.emp[0].gender && item.emp[0].gender.toLowerCase() == 'female'
                })

                if (ifWomanIsAlone && femaleEmps && femaleEmps.length == 1) { sendNotification(femaleEmps[0].emp[0], supervisorLevel, channels, context, 'woman-alone-office-after-shift', '') }
            })
        }
    ], (err) => {
        logger.info(`err on trigger alert employeeAfterShift`)
        logger.error(`${err}`)
    })
}

exports.process = (data, alert, context) => {
    let noOfMinutes = 60

    if (alert.config.trigger) {
        noOfMinutes = alert.config.trigger.hours ? alert.config.trigger.noOfMinutes : noOfMinutes
    }

    db.shiftType.findById({
        _id: data.id
    }).then(shiftType => {
        let endTime = moment(shiftType.endTime).add(noOfMinutes, 'minutes')
        let endHours = endTime.get('hour')
        let endMins = endTime.get('minute')
        let millisecond = 60000 * noOfMinutes
        // return start(data, config, context, shiftType, `00 40 16 * * *`);
        return setTimeout(() => {
            start(data, alert, context, shiftType)
        }, millisecond)
        // return start(data, config, context, shiftType, `00 ${endMins} ${endHours} * * *`);
    })
        .catch(err => cb(err))
}
