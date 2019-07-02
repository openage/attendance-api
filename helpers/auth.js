'use strict'
var jwt = require('jsonwebtoken')
var db = require('../models')
var authConfig = require('config').get('auth')

const contextBuilder = require('./context-builder')
const users = require('../services/users')

const fetch = (req, modelName, paramName) => {
    var value = req.query[`${modelName}-${paramName}`] || req.headers[`x-${modelName}-${paramName}`]
    if (!value && req.body[modelName]) {
        value = req.body[modelName][paramName]
    }
    if (!value) {
        return null
    }

    var model = {}
    model[paramName] = value
    return model
}

const extractJWT = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, authConfig.secret, {
            ignoreExpiration: true
        }, function (err, claims) {
            if (err) {
                reject(err)
            } else {
                resolve(claims)
            }
        })
    })
}

const extractFromRoleKey = async (roleKey, logger) => {
    let log = logger.start('extractRoleKey')
    let employee = await users.getFromDirectory(roleKey, log)
    if (!employee) {
        throw new Error('invalid role key')
    }

    employee.recentLogin = Date.now()
    await employee.save()
    log.end()

    return employee
}

var extractFromToken = async (token, logger) => {
    let log = logger.start('extractFromToken')
    let claims = await extractJWT(token)

    let employee = null

    if (claims.roleKey) {
        employee = await extractFromRoleKey(claims.roleKey, log)
        log.end()
        return employee
    }

    employee = await db.employee.findById(claims.employee).populate({ path: 'organization' })

    if (!employee) {
        throw new Error('no employee found')
    }
    employee.recentLogin = Date.now()
    await employee.save()
    log.end()

    return employee
}

exports.requiresToken = (req, res, next) => {
    let log = res.logger.start('helpers/auth:requiresToken')
    var token = req.body.token || req.query.token || req.headers['x-access-token']

    var role = fetch(req, 'role', 'key')

    if (!token && !role) {
        return res.status(403).send({
            success: false,
            message: 'token or role key is required.'
        })
    }

    if (token && token.length === 36) {
        role = {
            key: token
        }
    }
    let employeePromise = (role && role.key) ? extractFromRoleKey(role.key, log) : extractFromToken(token, log)

    employeePromise.then(employee => {
        contextBuilder.create({
            employee: employee,
            organization: employee.organization
        }, res.logger).then(context => {
            req.employee = employee
            req.context = context
            next()
        })
    }).catch(err => {
        res.failure('invalid credentials')
    })
}

// TODO: check where used
exports.requiresSupervisor = (req, res, next) => {
    db.teamMember.findOne({
        where: { RegularEmployeeId: req.employee.id },
        include: [{
            model: db.employee,
            as: 'Supervisor'
        }],
        attributes: ['id']
    }).then(teamMember => {
        if (!teamMember) {
            throw new Error('no teamMember found')
        }
        contextBuilder.create({
            supervisor: teamMember.Supervisor
        }, res.logger).then(context => {
            req.context = context
            req.supervisor = teamMember.Supervisor
            next()
        })
    }).catch(err => {
        res.failure(err)
    })
}

exports.requiresOrg = (req, res, next) => {
    if (req.context && req.context.organization) {
        return next()
    }
    var orgCode = req.body.orgCode || req.query.orgCode || req.headers['org-code']

    if (!orgCode) {
        return res.failure('org-code is required.')
    }
    db.organization.findOne({
        code: orgCode.toLowerCase()
    }).then(org => {
        if (!org) {
            return res.failure('organization does not exist')
        }

        contextBuilder.create({
            organization: org
        }, res.logger).then(context => {
            req.context = context
            req.org = org
            next()
        })
    })
}

exports.getToken = (employee) => {
    let roleKey = null
    if (employee.role) {
        roleKey = employee.role.key
    }
    var claims = {
        employee: employee.id,
        code: employee.code,
        EmpDb_Emp_id: employee.EmpDb_Emp_id,
        roleKey: roleKey
    }

    return jwt.sign(claims, authConfig.secret, {
        expiresIn: authConfig.tokenPeriod || 1440
    })
}

exports.newPin = () => {
    return Math.floor(1000 + Math.random() * 9000)
}
