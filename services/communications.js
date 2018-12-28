'use strict'
const template = require('../helpers/template')
const logger = require('@open-age/logger')('services.communication')
const _ = require('underscore')
const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')
const templateHelper = require('../helpers/template')
const providersConfig = require('config').get('providers')
const db = require('../models')

const getRecievers = to => {
    let recievers = []
    let population = {}

    if (to.level === 0) {
        recievers.push({
            employee: to.employee,
            priority: 1
        })
        return Promise.cast(recievers)
    }

    if (!to.employee.supervisor) {
        // no reciever will recive message
        return Promise.cast(recievers)
    }

    if (to.level === 1) {
        return db.employee.findById(to.employee.supervisor)
            .then(supervisor => {
                recievers.push({
                    employee: supervisor,
                    priority: 2
                })
                return recievers
            })
    }

    if (to.level === 2) {
        return db.employee.findById(to.employee.supervisor)
            .populate('supervisor')
            .then(supervisor => {
                recievers.push({
                    employee: supervisor,
                    priority: 1
                })

                recievers.push({
                    employee: supervisor.supervisor,
                    priority: 2
                })

                return recievers
            })
    }
}

const saveNotificationInDb = (content, to) => {
    let message = templateHelper
        .formatter(fs.readFileSync(path.join(appRoot.path, `/templates/${content.template}.html`), 'utf8'))
        .inject(content.data)

    var title = fs.readFileSync(path.join(appRoot.path, `/templates/${content.template}.title.html`), 'utf8')

    var notificationObj = {
        date: new Date(),
        message: message,
        subject: title,
        status: content.actions && content.actions.length ? 'active' : 'inactive',
        data: {
            entity: content.entity,
            api: content.entity.type,
            action: '' // TODO:
        }
    }

    if (content.actions && content.actions.length) {
        notificationObj.task = {
            // id: content.data.leave ? content.data.leave.id : null,
            type: 'leave',
            actions: content.actions
        }
        if (content.data.leave) { notificationObj.task.id = content.data.leave.id }
    }

    // return Promise.resolve([{to: to.employee, item: notificationObj, priority: 3}]); //For Test not to save in db

    return Promise.all([
        new db.notification(notificationObj).save(),
        getRecievers(to)
    ])
        .spread((notification, recievers) => {
            let notifications = []
            return Promise.mapSeries(recievers, reciever => {
                return db.employee.findOneAndUpdate({
                    _id: reciever.employee
                }, {
                    $push: {
                        notifications: {
                            $each: [{
                                notification: notification,
                                priority: reciever.priority || 3
                            }],
                            $position: 0
                        }
                    }
                }, {
                    new: true
                }).then(employee => {
                    notifications.push({
                        to: employee,
                        priority: reciever.priority || 3,
                        item: notification
                    })
                })
            }).then(() => notifications)
        })
}

const getChannel = (channelName, context) => {
    var log = logger.start('getChannel')

    if (channelName === 'push') {
        return Promise.cast({
            type: {
                providerName: 'oneSignal'
            },
            config: providersConfig.oneSignal
        })
    }

    return db.organization.findById(context.organization.id)
        .populate({
            path: `communicationApps.${channelName}`,
            populate: {
                path: 'type'
            }
        })
        .then(organization => {
            if (!organization.communicationApps ||
                !organization.communicationApps[channelName]) {
                log.error(`${organization.code} organization is not configured for '${channelName}' channel`)
                return Promise.resolve(null)
            }

            if (_.isEmpty(organization.communicationApps[channelName].config)) {
                log.error(`${organization.code} has not set their configurations 
                found while sending mesg via ${channelName}`)

                throw new Error(`no configurations found while sending mesg via ${channelName}`)
            }

            let channelObj = organization.communicationApps[channelName]
            let providerName = channelObj.type.providerName

            if (channelObj.status !== 'active') {
                logger.info(`${organization.code} ${channelName} channel is not active`)
                return Promise.resolve(null)
            }

            return channelObj
        })
}

let send = async (to, content, channelNames, context) => {
    let log = context.logger.start('services/communications:send')
    if (!to.level) {
        to.level = 0
    }

    let notifications = await saveNotificationInDb(content, to)
    log.debug('saved as notification')

    for (const channelName of channelNames) {
        log.debug(`sending via '${channelName}'`)
        let channel = await getChannel(channelName, context)

        if (!channel) {
            log.info(`'${channelName}' not found in organization`)
            continue
        }

        let provider = require(`../providers/${channel.type.providerName}`)

        for (const notification of notifications) {
            switch (channelName) {
            case 'push':
                await provider.push(notification.item, notification.to, channel.config, context)
                break
            case 'sms':
                await provider.sms(notification.item, notification.to, channel.config, context)
                break
            case 'chat':
                await provider.chat(notification.item, notification.to, channel.config, context)
                break
            case 'email':
                content.data.to = notification.to
                var body = templateHelper
                    .formatter(fs.readFileSync(path.join(appRoot.path, `/templates/${content.template}.body.html`), 'utf8'))
                    .inject(content.data)
                await provider.email({
                    subject: notification.item.message,
                    body: body
                }, notification.to, channel.config, context)
                break
            }
        }
    }
}

exports.send = (to, content, channelNames, context) => {
    try {
        return send(to, content, channelNames, context)
    } catch (err) {
        context.logger.error('err in communication service')
        context.logger.error(err)
    }
}
