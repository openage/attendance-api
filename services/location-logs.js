'use strict'
const db = require('../models')
const maps = require('../providers/google-maps')
const offline = require('@open-age/offline-processor')

exports.create = async (model, context) => {
    let location = await maps.getLocality(model.location.coordinates)

    let summary

    const lastLocation = await db.locationLog.findOne({ attendance: model.attendance.id, user: context.user }).sort({ _id: -1 })

    if (lastLocation) {
        summary = await maps.getDistance(lastLocation.location.coordinates, location.coordinates)
    }

    let entity = new db.locationLog({
        attendance: model.attendance.id,
        time: model.time || new Date(),
        ipAddress: model.ipAddress,
        message: model.message,
        location: location,
        duration: summary ? summary.duration : 0,
        distance: summary ? summary.distance : 0,
        user: context.user,
        organization: context.organization,
        tenant: context.tenant
    })

    await entity.save()
    await offline.queue('locationLog', 'create', entity, context)

    return entity
}

exports.get = async (query, context) => {
    context.logger.silly('services/location-logs:get')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.locationLog.findById(query).populate('attendance')
        }
    } else if (query.id) {
        return db.locationLog.findById(query.id).populate('attendance')
    } else if (query.attendanceId) {
        return db.locationLog.findOne({ attendance: query.attendanceId }).populate('attendance')
    }
    return null
}

exports.search = async (query, paging, context) => {
    const where = {
        tenant: context.tenant,
        organization: context.organization
    }

    if (query.attendanceId) {
        where.attendanceId = query.attendanceId
    }

    let locationLogs = await db.locationLog.find(where).sort({ time: -1 })

    return {
        items: locationLogs
    }

    // let from = attendance.checkIn
    // let till = attendance.checkOut

    // if (!till && moment(new Date()).isSame(attendance.ofDate, 'day')) {
    //     till = new Date()
    // }

    // if (!till) {
    //     let endTime = moment(attendance.shift.shiftType.endTime)
    //     let till = moment(attendance.ofDate)
    //         .set('hour', endTime.get('hour'))
    //         .set('minute', endTime.get('minute'))
    //         .set('second', endTime.get('second')).toDate()

    //     if (till < from) {
    //         till = moment(attendance.ofDate).add(1, 'days')
    //             .set('hour', endTime.get('hour'))
    //             .set('minute', endTime.get('minute'))
    //             .set('second', endTime.get('second')).toDate()
    //     }
    // }

    // let logs = []

    // let lastLog

    // for (let date = moment(till); moment(from).isBefore(date); date = moment(date).subtract(30, 'minutes')) {
    //     let log = locationLogs.find(item =>
    //         moment(item.time).isBetween(date, moment(date).add(30, 'minutes'), 's', '[]')) ||
    //         lastLog
    //     if (log) {
    //         logs.push({
    //             time: date.toDate(),
    //             attendance: log.attendance,
    //             employee: log.employee,
    //             ipAddress: log.ipAddress,
    //             location: log.location,
    //             message: log.message
    //         })

    //         lastLog = log
    //     }
    // }

    // return res.page(locationMapper.toSearchModel(logs, context))
}
