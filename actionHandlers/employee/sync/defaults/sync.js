'use strict'

const employees = require('../../../../services/employees')
const providerConfig = require('config').get('providers')

const moment = require('moment')

exports.process = async (syncConfigurations, context) => {
    syncConfigurations.type = { providerName: 'directory' }

    syncConfigurations.config.lastSyncDate = context.organization.lastSyncDate ? context.organization.lastSyncDate : moment(context.organization.created_At)

    syncConfigurations.config.url = providerConfig[syncConfigurations.type.providerName]['url']

    await employees.sync(syncConfigurations, context)
    context.organization.lastSyncDate = moment().subtract(1, 'hours').toISOString()
    await context.organization.save()

    context.logger.info('lastSyncDate updated')
}
