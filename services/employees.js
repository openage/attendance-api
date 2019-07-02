'use strict'
const logger = require('@open-age/logger')('services.employee')
const async = require('async')
const dbQuery = require('../helpers/querify')
const moment = require('moment')
const tagTypeService = require('../services/tag-types')
const jimp = require('jimp')
const _ = require('underscore')
const auth = require('../helpers/auth')
const offline = require('@open-age/offline-processor')
const teams = require('../services/teams')
const tasks = require('../services/tasks')

const shiftTypeService = require('./shift-types')
const attendanceService = require('./attendances')
const employeeGetter = require('./employee-getter')

const monthlySummaryService = require('./monthly-summaries')
const contextBuilder = require('../helpers/context-builder')

const dates = require('../helpers/dates')
const db = require('../models')

const shiftService = require('./shifts')

const biometricService = require('./biometrics')

exports.addEffectiveShift = (item, orgId, callback) => {
    let query = {
        organization: orgId,
        code: item.empCode
    }
    async.eachSeries(item.rosterShiftTypes, (rosterShiftType, next) => {
        db.shiftType.findOne({
            organization: orgId,
            code: rosterShiftType.code
        })
            .then((shift) => {
                if (!shift) {
                    throw new Error('No ShiftType Found')
                }
                let upComingShift = {
                    shiftType: shift.id,
                    date: moment(rosterShiftType.date, 'DD/MM/YYYY', true)
                }
                db.employee.findOne(query)
                    .then((employee) => {
                        if (!employee) {
                            throw new Error('No Employee Found')
                        }
                        employee.effectiveShift.push(upComingShift)
                        employee.save()
                        next()
                    })
                    .catch(err => {
                        logger.error(err)
                        next() // to loop to next emp if db err comes
                    })
            })
            .catch((err) => {
                logger.error(err)
                next()
            })
    }, (err) => {
        if (err) {
            return callback(err)
        }
        return callback(null)
    })
}

let getPicDataFromUrl = (url) => {
    return new Promise((resolve, reject) => {
        return jimp.read(url)
            .then(function (lenna) {
                var a = lenna.resize(15, 15) // resize
                    .quality(50) // set JPEG quality
                    .getBase64(jimp.MIME_JPEG, function (result, base64, src) {
                        return resolve(base64)
                    })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}

let addNewEmp = employee => {
    employee.status = 'active'
    return new db.employee(employee)
        .save()
        .then(emp => {
            console.log(`employee create ${emp.name}`)
            leveTypeManager(emp)
            emp.token = auth.getToken(emp)

            let context = {}
            context.organization = {}
            context.employee = null
            context.organization.id = employee.organization.id.toString()
            context.processSync = true
            offline.queue('employee', 'new', {
                id: emp.id
            }, context)

            if (!employee.picUrl) {
                return emp.save()
            }

            return getPicDataFromUrl(employee.picUrl)
                .then((picData) => {
                    emp.picData = picData
                    return emp.save()
                })
                .catch(err => {
                    emp.picData = null
                    return emp.save()
                })
        })
}

let updateExistingEmp = (employee, fieldsToUpdate) => {
    // updating employee when exists
    for (var key in fieldsToUpdate) {
        if (typeof fieldsToUpdate[key] === 'object' && fieldsToUpdate === 'designation') {
            employee[key] = fieldsToUpdate[key].name
        } else {
            employee[key] = fieldsToUpdate[key]
        }
    }

    console.log(`employee found ${employee.name}`)
    return employee.save()
        .then(employee => {
            employee.created = 'true'
            if (!fieldsToUpdate.picUrl) {
                return employee
            }
            return getPicDataFromUrl(fieldsToUpdate.picUrl)
                .then((picData) => {
                    employee.picData = picData
                    return employee.save()
                })
                .catch(err => {
                    employee.picData = null
                    return employee.save()
                })
        })
        .catch(err => {
            throw err
        })
}

let leveTypeManager = (employee, callback) => {
    async.waterfall([
        (cb) => {
            dbQuery.findLeaveTypes({
                organization: employee.organization.id
            })
                .then(leaveTypes => {
                    async.eachSeries(leaveTypes, (leaveType, next) => {
                        db.leaveBalance.findOrCreate({
                            employee: employee,
                            leaveType: leaveType
                        }, {
                            employee: employee,
                            leaveType: leaveType,
                            units: 0,
                            unitsAvailed: 0
                        }, {
                            upsert: true
                        }).then(() => {
                            next()
                        })
                    }, (err) => {
                        if (err) {
                            return cb(err)
                        }
                        cb(null, employee)
                    })
                })
                .catch(err => cb(err))
        }
    ],
    (err, employee) => {
        if (callback) {
            callback(err, employee)
        }
    })
}

let extractTags = async (model, context) => {
    let modelKeys = Object.keys(model)

    let newTags = []
    for (const key of modelKeys) {
        if (!(key === 'contractor' || key === 'department' || key === 'userType' || key === 'designation')) {
            continue
        }
        let tagType = (await tagTypeService.createOrFindTagType({
            name: key,
            organization: context.organization
        })).result

        if (model[key]) {
            let tag = (await db.tag.findOrCreate({
                name: (model[key].name || model[key]),
                tagType: tagType.id,
                status: 'active'
            })).result

            newTags.push(tag)
        }
    }

    return newTags
}

let employeeManager = employees => {
    return Promise.mapSeries(employees, item => {
        let query = {
            organization: item.organization.id
        }

        if (item.code) {
            query.code = item.code
        }
        return db.employee.findOne(query)
            .populate('tags shiftType')
            .then(employee => {
                if (employee) {
                    return updateExistingEmp(employee, item)
                } else {
                    return db.employee.findOne({
                        organization: item.organization.id,
                        EmpDb_Emp_id: item.EmpDb_Emp_id
                    }).populate('tags shiftType').then(emp => {
                        if (emp) {
                            return updateExistingEmp(emp, item)
                        } else {
                            return addNewEmp(item)
                        }
                    }).catch(err => {
                        throw err
                    })
                }
            })
    })
        .then(employees => {
            return employees
        })
        .catch(err => {
            throw err
        })
}

let shiftManeger = employees => { // if no shift then in general (find or create)
    let shiftName, shiftStartTime, shiftEndTime

    if (employees[0].shiftData &&
        employees[0].shiftData.name &&
        employees[0].shiftData.startTime &&
        employees[0].shiftData.endTime) {
        shiftName = employees[0].shiftData.name
        shiftStartTime = moment().set('hour', moment(employees[0].shiftData.startTime).hours())
            .set('minute', moment(employees[0].shiftData.startTime).minutes())
            .set('second', 0).set('millisecond', 0)

        shiftEndTime = moment().set('hour', moment(employees[0].shiftData.endTime).hours())
            .set('minute', moment(employees[0].shiftData.endTime).minutes())
            .set('second', 0).set('millisecond', 0)
    } else {
        logger.info(`no shift found so ${employees[0].name || employees[0].code} going to general`)

        shiftName = /gen/
        shiftStartTime = moment().set('hour', 9).set('minute', 0).set('second', 0).set('millisecond', 0)
        shiftEndTime = moment().set('hour', 18).set('minute', 0).set('second', 0).set('millisecond', 0)
    }

    return db.shiftType.findOrCreate({
        name: {
            $regex: shiftName,
            $options: 'i'
        },
        organization: employees[0].organization
    }, {
        name: 'general',
        code: 'gen',
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        monday: 'full',
        tuesday: 'full',
        wednesday: 'full',
        thursday: 'full',
        friday: 'full',
        saturday: 'off',
        sunday: 'off',
        organization: employees[0].organization
    }).then(data => {
        employees.forEach(employee => {
            employee.shiftType = data.result
        })
        return employees
    }).catch(err => err)
}

let teamManeger = employee => {
    return db.team.findOrCreate({
        supervisor: employee.supervisor,
        employee: employee
    })
        .then(team => {
            return team
        }).catch(err => {
            throw err
        })
}

const mergeEmployee = async (into, from, context) => {
    // TODO: implement this
    return null
}

const setBiometricCode = async (employee, biometricCode, context) => {
    let existingEmployee = await db.employee.findOne({
        biometricCode: biometricCode,
        organization: context.organization
    })

    if (existingEmployee && existingEmployee.status === 'active') {
        throw new Error(`Employee with code '${existingEmployee.code}' is using this biometric code`)
    }

    if (existingEmployee && existingEmployee.status === 'temp') {
        await mergeEmployee(employee, existingEmployee, context)
    }

    if (employee.biometricCode && biometricCode && employee.biometricCode !== biometricCode) {
        await biometricService.updateCode(employee, biometricCode, context)
    }

    employee.biometricCode = biometricCode

    return employee
}

const setSupervisor = async (employee, supervisor, context) => {
    let newSupervisor = await db.employee.findOne({
        code: supervisor.code,
        organization: context.organization
    })

    if (!newSupervisor) {
        supervisor.shiftType = employee.shiftType
        newSupervisor = await updateCreateEmployee(supervisor, context)
    }

    employee.supervisor = newSupervisor
    await teams.setSupervisor(employee, employee.supervisor, context)

    return employee
}

const setShiftType = async (employee, shiftTypeModel, context) => {
    if (employee.shiftType && (employee.shiftType.id === shiftTypeModel.id || employee.shiftType.code === shiftTypeModel.code)) {
        return employee
    }

    let shiftType = await shiftTypeService.get(shiftTypeModel, context)
    employee.shiftType = shiftType

    await attendanceService.setShift(dates.date(new Date()).bod(), employee, shiftType, context)

    return employee
}

const weeklyOff = (employee, weeklyOffModel, context) => {
    employee.weekOff = employee.weekOff || {}

    if (weeklyOffModel.sunday !== undefined) {
        employee.weeklyOff.sunday = weeklyOffModel.sunday
    }
    if (weeklyOffModel.monday !== undefined) {
        employee.weeklyOff.monday = weeklyOffModel.monday
    }
    if (weeklyOffModel.tuesday !== undefined) {
        employee.weeklyOff.tuesday = weeklyOffModel.tuesday
    }
    if (weeklyOffModel.wednesday !== undefined) {
        employee.weeklyOff.wednesday = weeklyOffModel.wednesday
    }
    if (weeklyOffModel.thursday !== undefined) {
        employee.weeklyOff.thursday = weeklyOffModel.thursday
    }
    if (weeklyOffModel.friday !== undefined) {
        employee.weeklyOff.friday = weeklyOffModel.friday
    }
    if (weeklyOffModel.saturday !== undefined) {
        employee.weeklyOff.saturday = weeklyOffModel.saturday
    }

    employee.weeklyOff.isConfigured = employee.weeklyOff.sunday ||
        employee.weeklyOff.monday ||
        employee.weeklyOff.tuesday ||
        employee.weeklyOff.wednesday ||
        employee.weeklyOff.thursday ||
        employee.weeklyOff.friday ||
        employee.weeklyOff.saturday

    return employee
}

const setEntity = async (employee, model, context) => {
    let snapShotModel = {
        employeeId: model.id,
        isDynamicShift: true
    }

    if (model.name) {
        employee.name = model.name
    }

    if (model.picUrl && employee.picUrl !== model.picUrl) {
        employee.picUrl = model.picUrl
        employee.picData = await getPicDataFromUrl(employee.picUrl)
    }

    if (model.gender) {
        employee.gender = model.gender
    }

    if (model.phone) {
        employee.phone = model.phone
    }

    if (model.fatherName) {
        employee.fatherName = model.fatherName
    }

    if (model.email) {
        employee.email = model.email
    }

    if (model.code) {
        employee.code = model.code
    }

    if (model.biometricCode && employee.biometricCode !== model.biometricCode) {
        employee = await setBiometricCode(employee, model.biometricCode, context)
    }

    if (model.supervisor && model.supervisor.code && (!employee.supervisor || employee.supervisor.code !== model.supervisor.code)) {
        employee = await setSupervisor(employee, model.supervisor, context)
    }

    if (model.dob) {
        employee.dob = model.dob
    }

    if (model.isDynamicShift !== undefined) {
        let shiftTypes = await shiftTypeService.search(snapShotModel, context)

        if (shiftTypes && shiftTypes.length) {
            employee.isDynamicShift = model.isDynamicShift
        } else if (shiftTypes && shiftTypes.length === 0) {
            return `No dynamicShift found for employee with code: ${model.code}`
        }
    }

    if (model.token) {
        employee.token = model.token
    }

    if (model.Ext_token) {
        employee.Ext_token = model.Ext_token
    }

    if (model.guid) {
        employee.guid = model.guid
    }

    if (model.designation) {
        employee.designation = model.designation.name || model.designation
    }

    if (model.division) {
        employee.division = model.division.name || model.division
    }

    if (model.department) {
        employee.department = model.department.name || model.department
    }
    if (model.config) {
        if (model.config.employmentType === 'contract') {
            if (model.config && model.config.contractor) {
                employee.contractor = model.config.contractor.name.toLowerCase() || model.config.contractor
            }
        } else if (model.config.employmentType === 'permanent') {
            employee.contractor = ''
        }
    }

    if (model.userType) {
        employee.userType = model.userType
    }

    if (model.config) {
        employee.config = model.config
    }

    if (model.dol || model.deactivationDate) {
        employee.deactivationDate = model.dol || model.deactivationDate
    } else if (employee.status !== model.status && model.status === 'inactive' && !employee.deactivationDate) {
        employee.deactivationDate = dates.date().eod()
    }

    if (model.status) {
        if (employee.status !== model.status && model.status === 'inactive') {
            await biometricService.remove(employee, context)
        }
        employee.status = model.status
    }

    if (model.role) {
        employee.role = employee.role || {}
        employee.role.id = model.role.id
        employee.role.code = model.role.code
        employee.role.key = model.role.key
        employee.role.permissions = model.role.permissions || []
    }

    if (model.shiftType) {
        employee = await setShiftType(employee, model.shiftType, context)
    }

    if (model.weeklyOff) {
        employee = await weeklyOff(employee, model.weeklyOff, context)
    }

    if (model.devices) { // TODO: this is obsolete
        employee.devices = []

        if (model.devices.length) {
            model.devices.forEach(item => {
                employee.devices.push({
                    id: item.device,
                    status: item.status || 'enable',
                    code: item.code || employee.biometricCode || employee.code
                })
            })
        }
    }

    if (model.abilities) {
        employee.abilities = employee.abilities || {}
        Object.keys(model.abilities).forEach(key => {
            employee.abilities[key] = model.abilities[key]
        })
        employee.markModified('abilities')
    }

    await monthlySummaryService.updateEmployee(employee, context)

    // employee.tags = await extractTags(model, context)

    return employee
}

const updateCreateEmployee = async (model, context) => {
    if (!model) {
        return
    }
    let isNew = false

    let employee = await db.employee.findOne({
        organization: context.organization.id,
        code: model.code
    }).populate('tags shiftType supervisor')

    if (!employee) {
        employee = await db.employee.findOne({
            organization: context.organization.id,
            EmpDb_Emp_id: model.EmpDb_Emp_id
        }).populate('tags shiftType supervisor')
    }

    if (!employee && model.biometricCode) {
        employee = await db.employee.findOne({
            organization: context.organization.id,
            biometricCode: model.biometricCode,
            status: 'temp'
        }).populate('tags shiftType supervisor')
    }

    if (!employee) {
        employee = new db.employee({
            status: 'active',
            EmpDb_Emp_id: model.EmpDb_Emp_id,
            organization: context.organization
        })

        await employee.save()
        isNew = true
    }

    await setEntity(employee, model, context)

    await employee.save()

    if (isNew) {
        await offline.queue('employee', 'new', {
            id: employee.id
        }, context)
    }

    return employee
}

exports.create = async (model, context) => {
    let log = context.logger.start('services/employees:create')

    if (!model) {
        return
    }

    let isNew = false
    let employee
    if (model.code) {
        employee = await db.employee.findOne({
            organization: context.organization.id,
            code: model.code
        }).populate('tags shiftType supervisor')
    }

    if (!employee && model.EmpDb_Emp_id) {
        employee = await db.employee.findOne({
            organization: context.organization.id,
            EmpDb_Emp_id: model.EmpDb_Emp_id
        }).populate('tags shiftType supervisor')
    }

    if (!employee) {
        isNew = true
        employee = new db.employee({
            status: model.status || 'active',
            EmpDb_Emp_id: model.EmpDb_Emp_id,
            organization: context.organization
        })
    }
    await setEntity(employee, model, context)
    await employee.save()
    if (isNew) {
        await offline.queue('employee', 'new', {
            id: employee.id
        }, context)
    }
    log.end()
    return employee
}

exports.update = async (model, employee, context) => {
    let log = context.logger.start('services/employees:update')
    await setEntity(employee, model, context)
    await employee.save()
    log.end()
    return employee
}

exports.get = async (query, context) => {
    return employeeGetter.get(query, context)
}

/**
 * get employees by code in an org,
 * if one does not exist, it creates one with default values
 */
exports.getByCode = async (code, context) => {
    let employee = await db.employee.findOne({
        code: code,
        organization: context.organization
    }).populate({
        path: 'shiftType'
    }).populate('supervisor')

    if (employee) {
        return employee
    }

    let shiftType = await db.shiftType.findOne({
        code: 'gen',
        organization: context.organization
    })

    if (!shiftType) {
        throw new Error(`no shift type of code 'gen' available in org '${context.organization.code}'`)
    }

    employee = new db.employee({
        code: code,
        organization: context.organization,
        shiftType: shiftType
    })
    await employee.save()

    return employee
}

/**
 *  gets the employees from the provider
 * @param employeeChannel the source
 */
exports.sync = async (employeeChannel, context) => {
    employeeChannel.config.organization = context.organization
    let provider = require(`../providers/${employeeChannel.type.providerName}`)
    let employees = await provider.fetch(employeeChannel.config)

    for (const model of employees) {
        await updateCreateEmployee(model, context)
    }
}

exports.teamManeger = teamManeger
exports.shiftManeger = shiftManeger
exports.employeeManager = employeeManager
exports.getPicDataFromUrl = getPicDataFromUrl
exports.updateCreateEmployee = updateCreateEmployee
