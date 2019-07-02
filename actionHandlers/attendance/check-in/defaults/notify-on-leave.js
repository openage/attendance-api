'use strict'

const communications = require('../../../../services/communications')
const entities = require('../../../../helpers/entities')
const db = require('../../../../models')

const attendanceService = require('../../../../services/attendances')

const attendanceStates = attendanceService.attendanceStatus

exports.process = async (attendance, context) => {
    let supervisorLevel = 0
    let channels = ['push']
    let notifyTo

    let leave = await db.leave.findOne({
        employee: attendance.employee.id.toString(),
        date: attendance.ofDate
    }).populate('employee')

    if (attendance.status !== attendanceStates.onLeave) {
        context.logger.info(`today ${attendance.employee.name} was not on leave`)
        return
    }

    attendance.status = attendanceStates.present
    await attendance.save()
    notifyTo = attendance.employee
    if (attendance.employee.supervisor) {
        notifyTo = attendance.employee.supervisor
    }

    await communications.send({
        employee: notifyTo,
        level: supervisorLevel
    }, {
        actions: [
            'cancel'
        ],
        entity: entities.toEntity(leave.employee, 'employee'),
        data: {
            leave: leave,
            employee: attendance.employee.name
        },
        template: 'cancel-leave-on-present'
    }, channels, context)
}
