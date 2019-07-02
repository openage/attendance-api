'use strict'
const _ = require('underscore')
const moment = require('moment')
const shifts = require('./shifts')
const logger = require('@open-age/logger')('services.teams')
const db = require('../models')

const updateSupervisor = async (supervisorAttendance) => {
    logger.start('updateSupervisor')
    await supervisorAttendance.save()
    logger.info('supervisor attendance updated')
    return Promise.resolve(null)
}

const attendanceByDate = async (employee, attendance, shift) => {
    logger.start('attendanceByDate')
    return db.attendance.findOrCreate({
        employee: employee.id.toString(), // find one if get when person comes earlier with status checkedIn
        ofDate: {
            $gte: moment(attendance.ofDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0),
            $lt: moment(attendance.ofDate).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).add(1, 'day')
        }
    }, {
        employee: employee.id.toString(),
        status: 'absent',
        shift: shift,
        ofDate: moment(attendance.ofDate)
            .set('hour', moment(attendance.ofDate).hours())
            .set('minute', moment(attendance.ofDate).minutes())
            .set('second', 0)
            .set('millisecond', 0)._d
    })
}

const supervisorUpdate = async (attendance, supervisor, shift, teamMembers, context) => {
    logger.start('supervisorUpdate')
    var teamCount, presentCount, absentCount, leaveCount, lateCount, isLate, activeCount
    let supervisorAttendance = await attendanceByDate(supervisor, attendance, shift)
    if (supervisorAttendance.created) {
        logger.info(`${supervisor.name}'s attendance is created with id ${supervisorAttendance.result.id}`)
    }
    logger.info(`${supervisor.name}'s attendance found with id ${supervisorAttendance.result.id}`)
    supervisorAttendance = supervisorAttendance.result
    teamCount = teamMembers.length
    presentCount = supervisorAttendance.team.presentCount ? supervisorAttendance.team.presentCount : 0
    activeCount = supervisorAttendance.team.activeCount ? supervisorAttendance.team.activeCount : 0
    lateCount = supervisorAttendance.team.lateCount ? supervisorAttendance.team.lateCount : 0
    leaveCount = supervisorAttendance.team.leaveCount ? supervisorAttendance.team.leaveCount : 0
    absentCount = supervisorAttendance.team.absentCount ? supervisorAttendance.team.absentCount : teamMembers.length
    isLate = moment(moment().set('hour', moment(attendance.checkIn).hours()).set('minute', moment(attendance.checkIn).minutes()).set('second', 0).set('millisecond', 0))
        .diff(moment(moment().set('hour', moment(attendance.shift.shiftType.startTime).hours()).set('minute', moment(attendance.shift.shiftType.startTime).minutes()).set('second', 0).set('millisecond', 0))) > 0

    if (attendance.status === 'onLeave') {
        supervisorAttendance.team.teamCount = teamCount
        supervisorAttendance.team.leaveCount = ++leaveCount
        if (supervisorAttendance.team.leaveCount) {
            supervisorAttendance.team.absentCount = supervisorAttendance.team.absentCount ? --supervisorAttendance.team.absentCount : teamMembers.length - supervisorAttendance.team.leaveCount
        }
        logger.info(`employee is on leave, updating leaveCount in attendance of ${supervisor.name} as he is supervising`)
        return updateSupervisor(supervisorAttendance)
    }

    if (!supervisorAttendance.team.teamCount) {
        supervisorAttendance.team.teamCount = teamCount
        supervisorAttendance.team.absentCount = absentCount
    }

    // if (attendance.status === 'missSwipe' && attendance.updatePreviousAttendance) {
    //     supervisorAttendance.team.presentCount = ++presentCount
    //     supervisorAttendance.team.absentCount = --absentCount
    //     if (attendance.checkIn) {
    //         if (isLate) {
    //             supervisorAttendance.team.lateCount = ++lateCount
    //         }
    //     }
    // }

    if (attendance.status === 'present' || (attendance.status === 'halfday' && attendance.minsWorked)) {
        if (attendance.updatePreviousAttendance) {
            supervisorAttendance.team.presentCount = ++presentCount
            supervisorAttendance.team.absentCount = --absentCount
            if (attendance.checkIn) {
                if (isLate) {
                    supervisorAttendance.team.lateCount = ++lateCount
                }
            }
        }
        if (!attendance.updatePreviousAttendance) {
            supervisorAttendance.team.activeCount = --supervisorAttendance.team.activeCount
        }
        if (attendance.lastWorkedHours) {
            supervisorAttendance.team.teamWorked = supervisorAttendance.team.teamWorked ? supervisorAttendance.team.teamWorked - attendance.lastWorkedHours : supervisorAttendance.team.teamWorked
        }
        supervisorAttendance.team.teamWorked = supervisorAttendance.team.teamWorked ? supervisorAttendance.team.teamWorked + (attendance.hoursWorked * 60 + attendance.minsWorked) : attendance.hoursWorked * 60 + attendance.minsWorked
    }

    if (attendance.status === 'checked-in-again' && !attendance.updatePreviousAttendance) {
        supervisorAttendance.team.activeCount = ++activeCount
    }

    if (attendance.status === 'checkedIn') {
        supervisorAttendance.team.presentCount = ++presentCount
        supervisorAttendance.team.absentCount = --absentCount
        if (!attendance.updatePreviousAttendance) { supervisorAttendance.team.activeCount = ++activeCount }
        if (isLate) {
            supervisorAttendance.team.lateCount = ++lateCount
        }
    }
    // same case as checkedIn but late checkin so status is halfday
    if (attendance.status === 'halfday' && (!attendance.hoursWorked && !attendance.minsWorked)) {
        supervisorAttendance.team.presentCount = ++presentCount
        supervisorAttendance.team.absentCount = --absentCount
        if (!attendance.updatePreviousAttendance) { supervisorAttendance.team.activeCount = ++activeCount }
        if (isLate) {
            supervisorAttendance.team.lateCount = ++lateCount
        }
    }
    logger.info(`employee is in office, updating count in attendance of ${supervisor.name} as he is supervising`)
    return updateSupervisor(supervisorAttendance)
}

const addNewTeam = async (supervisors, members) => {
    if (members.length <= 0 || supervisors.length <= 0) {
        return null
    }
    return Promise.each(supervisors, supervisor => {
        return Promise.each(members, member => {
            return db.team.findOrCreate({
                supervisor: supervisor,
                employee: member
            }, {
                supervisor: supervisor,
                employee: member
            }).then((team) => {
                logger.info('team added')
            })
        })
    }).then(() => {
        logger.info('teams added')
        return Promise.resolve(null)
    }).catch((err) => {
        logger.error(err)
        return Promise.resolve(null)
    })
}

const removeOldTeam = (supervisors, members) => {
    if (supervisors.length <= 0) {
        return Promise.resolve(null)
    }
    return Promise.each(members, member => {
        return Promise.each(supervisors, supervisor => {
            return db.team.remove({
                supervisor: supervisor,
                employee: member
            }).then((team) => {
                logger.info('team deleted')
            })
        })
    }).then(() => {
        logger.info('teams deleted')
        return Promise.resolve(null)
    }).catch((err) => {
        logger.error(err)
        return Promise.resolve(null)
    })
}

/**
 * gets all the employees that reports to an employee
 * @param Employee employee
 */
const getTeam = async (employee) => {
    logger.start('getTeam')

    return db.team.aggregate([{
        $lookup: {
            localField: 'employee',
            from: 'employees',
            foreignField: '_id',
            as: 'employee'
        }
    },
    {
        $match: {
            $or: [{
                'supervisor': employee.id.toObjectId(),
                'employee.status': 'active'
            },
            {
                'supervisor': employee.id.toObjectId(),
                'employee.status': 'inactive',
                'employee.deactivationDate': {
                    $gte: moment().toDate()
                }
            }
            ]
        }
    },
    {
        $project: {
            'employee': { '$arrayElemAt': ['$employee', 0] }
        }
    }
    ])
        // return db.team.find({
        //     supervisor: employee,
        //     employee: {$exists: true}
        // })
        .then(members => {
            logger.info(`${employee.name} have ${members.length} members in his/her team`)
            return _.pluck(members, 'employee')
        })
}

const deactivationDateManager = async (employee, context) => {
    let log = context.logger.start('updatingSupervisor')

    let newSupervisor = employee.supervisor ? employee.supervisor.toString() : null

    await db.employee.update({
        supervisor: employee.id
    }, {
        $set: {
            supervisor: newSupervisor
        }
    }, { multi: true })

    await db.employee.findByIdAndUpdate({
        _id: employee.id
    }, {
        $unset: {
            deactivationDate: 1
        }
    }, { new: true })
}

/**
 * gets all the supervisors of an employee
 * @param Employee employee
 */
const getSupervisors = async (employee) => {
    let supervisors = await db.team.find({
        employee: employee,
        supervisor: { $exists: true }
    }).populate({
        path: 'supervisor',
        populate: {
            path: 'shiftType'
        }
    })
        .then(members => {
            return _.pluck(members, 'supervisor')
        })

    let items = []

    supervisors.forEach(item => {
        if (item && item.code) {
            items.push(item)
        }
    })

    return items
}

/**
 * removes obsolete team members and adds new team members
 * @param Employee employee
 * @param Employee supervisor
 * @param {*} context
 */
const setSupervisor = async (employee, supervisor, context) => {
    let log = context.logger.start('setSupervisor')
    log.info(`setting up ${employee.name} supervisors`)

    let oldSupervisors = await db.team.find({ employee: employee }) // myOldSupervisorsList
    let newSupervisors = await db.team.find({ employee: supervisor }) // myNewSupervisorList OR mySupervisorsSupervisorList
    let members = await getTeam(employee) // myTeamMembersWhereIAmSupervisor

    oldSupervisors = _.pluck(oldSupervisors, 'supervisor')
    newSupervisors = _.pluck(newSupervisors, 'supervisor')
    newSupervisors.push(supervisor)

    let newBosses = _.filter(newSupervisors, newSupervisor => {
        return !_.find(oldSupervisors, oldSupervisor => {
            if (oldSupervisor && newSupervisor) {
                return oldSupervisor.toString() === newSupervisor.toString()
            }
            return false
        })
    })

    let obsoleteBosses = _.filter(oldSupervisors, oldSupervisor => {
        return !_.find(newSupervisors, newSupervisor => {
            if (oldSupervisor && newSupervisor) {
                return newSupervisor.toString() == oldSupervisor.toString()
            }
            return false
        })
    })
    members.push(employee._id)
    if (employee.deactivationDate && moment(employee.deactivationDate).toDate() < moment().toDate()) {
        members.pop()
        obsoleteBosses.push(employee.id.toObjectId())
        log.info('old supervisor: deactivated, updating members supervisor')
        await deactivationDateManager(employee, context)
    }
    log.info(`${employee.name} have ${newBosses.length} number of new bosses`)
    log.info(`${employee.name} have ${obsoleteBosses.length} number of new obsolete bosses`)
    log.info(`${employee.name} have ${members.length} number of new members in team list`)

    await addNewTeam(newBosses, members)
    await removeOldTeam(obsoleteBosses, members)
}

const updateTeamSummary = async (data, context) => {
    data.attendance.lastWorkedHours = data.lastWorkedHours
    data.attendance.updatePreviousAttendance = data.updatePreviousAttendance
    logger.info(`Employee Found ${data.attendance.employee.name}`)

    let supervisors = await getSupervisors(data.attendance.employee._id.toString())
    logger.info(`${supervisors.length} Supervisors Found for ${data.attendance.employee.name}`)

    return Promise.each(supervisors, async (supervisor) => {
        logger.info(`Updating ${supervisor.code} attendance stats as he/she has ${data.attendance.employee.name} in team`)

        let shiftTime = period.prototype.setHourAndMinute(supervisor.shiftType.startTime)
        logger.info(`${supervisor.code} has shift startTime of ${shiftTime}`)
        if (data.attendance.updatePreviousAttendance) {
            shiftTime = moment(data.attendance.ofDate).toDate()
        }
        let teamMembers = await getTeam(supervisor)
        logger.info(`${supervisor.code} has ${teamMembers.length} in his/her team`)
        let shift = await shifts.getByTime(shiftTime, supervisor.shiftType, context)
        logger.info(`${supervisor.code} is going in shift ${shift.date}`)
        return supervisorUpdate(data.attendance, supervisor, shift, teamMembers, context)
    })
}

exports.setSupervisor = setSupervisor

exports.getSupervisors = getSupervisors

exports.getTeam = getTeam

exports.updateTeamSummary = updateTeamSummary
