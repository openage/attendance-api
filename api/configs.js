'use strict'
const syncConfigurations = require('config').get('sync')
const serverConfig = require('config').get('webServer')
const fs = require('fs')
const builder = require('xmlbuilder')
const appRoot = require('app-root-path')
const path = require('path')
const _ = require('underscore')
const moment = require('moment')
const db = require('../models')

exports.get = (req, res) => {
    let activationKey = req.query.activationKey
    if (!activationKey) {
        return res.failure('activationKey required')
    }
    db.organization.findOne({ activationKey: activationKey })
        .populate({
            path: 'devices',
            populate: {
                path: 'machine'
            }
        })
        .then(organization => {
            if (!organization) {
                throw new Error('no org found with this activation key')
            }
            return db.employee.findOne({ userType: 'superadmin', organization: organization })
                .then(employee => {
                    if (!employee) {
                        throw new Error('no admin found of this org')
                    }
                    return { employee: employee, organization: organization }
                }).catch(err => {
                    throw (err)
                })
        })
        .then(data => {
            return db.category.findOne({
                name: {
                    $regex: 'biometric',
                    $options: 'i'
                }
            })
                .then(category => {
                    return db.device.find({
                        organization: data.organization,
                        category: category
                    })
                        .populate('machine category')
                        .then(devices => {
                            data.devices = devices
                            return data
                        })
                })
        })
        .then(data => {
            var timestampData = {
                day: moment().subtract(2, 'day').get('date').toString().length === 1 ? '0' + moment().subtract(2, 'day').get('day').toString() : moment().subtract(2, 'day').get('date').toString(),
                month: moment().subtract(2, 'day').get('month').toString().length === 1 ? '0' + (moment().subtract(2, 'day').get('month') + 1).toString() : (moment().subtract(2, 'day').get('month') + 1).toString(),
                year: moment().subtract(2, 'day').get('year').toString()
            }

            var xmlNeeded = {
                config: {
                    '@version': data.organization.devicesVersion || '',
                    devices: {},
                    api: {
                        '@url': serverConfig.url || '',
                        '@token': data.employee.token || '',
                        '@orgCode': data.organization.code || ''
                    },
                    service: {
                        '@version': syncConfigurations.serviceVersion || '',
                        '@activationKey': data.organization.activationKey || ''
                    }
                }
            }

            var feed

            if (_.isEmpty(data.devices)) {
                feed = builder.create(xmlNeeded, { encoding: 'utf-8' })
            } else {
                for (var i = 0; i < data.devices.length; i++) {
                    xmlNeeded.config.devices['device' + i] = {

                        '@id': (data.devices[i].id).toString(),
                        '@no': '1',
                        '@ip': data.devices[i].ip,
                        '@port': data.devices[i].port,
                        '@make': data.devices[i].machine ? data.devices[i].machine.manufacturer : 'eSSL Lite',
                        '@prefix': data.devices[i].prefix || '0',
                        '@timestamp': `${timestampData.year}-${timestampData.month}-${timestampData.day}`
                        // '@mute': data.devices[i].mute,
                    }
                }

                feed = builder.create(xmlNeeded, { encoding: 'utf-8' })

                for (var j = 0; j < data.devices.length; j++) {
                    feed.children[0].children[j].name = 'device'
                }
            }

            feed.end({ pretty: true })

            fs.writeFile(`${path.join(appRoot.path, '/temp/device.config.xml')}`, '<?xml version="1.0"?>\n' +
                feed,
            function (err) {
                if (err) {
                    return res.failure(err)
                }
                res.download(`${path.join(appRoot.path, '/temp/device.config.xml')}`, 'device.config.xml')
            })
        })
        .catch(err => {
            res.failure(err)
        })
}
