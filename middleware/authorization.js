'use strict'
var jwt = require('jsonwebtoken')
var authConfig = require('config').get('auth')
var db = require('../models')

const contextBuilder = require('../helpers/context-builder')

var extractToken = (token, req, res, next) => {
    jwt.verify(token, authConfig.secret, {
        ignoreExpiration: true
    }, function (err, claims) {
        if (err) {
            return res.failure('invalid token.')
        }

        db.employee.findById(claims.employee)
            .populate({
                path: 'organization'
            })
            .then(employee => {
                if (!employee) {
                    throw new Error('no employee found')
                }
                employee.recentLogin = Date.now()
                return employee.save()
            })
            .then(employee => {
                contextBuilder.create({
                    employee: employee,
                    organization: employee.organization
                }, res.logger).then(context => {
                    req.employee = employee
                    req.context = context
                    next()
                })
            })
            .catch(err => {
                res.failure(err)
            })
    })
}

exports.requiresToken = (req, res, next) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['x-role-key']
    if (!token) {
        return res.status(403).send({
            success: false,
            message: 'token is required.'
        })
    }

    extractToken(token, req, res, next)
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

exports.getToken = employee => {
    var claims = {
        employee: employee.id,
        code: employee.code,
        EmpDb_Emp_id: employee.EmpDb_Emp_id
    }

    return jwt.sign(claims, authConfig.secret, {
        expiresIn: authConfig.tokenPeriod || 1440
    })
}

exports.newPin = () => {
    return Math.floor(1000 + Math.random() * 9000)
}
