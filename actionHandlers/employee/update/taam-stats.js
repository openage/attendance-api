'use strict'

const moment = require('moment')
const teams = require('../../../services/teams')
const employees = require('../../../services/employees')
const insightSummaries = require('../../../services/insight-summaries')

const myTeamCount = async (employee, context) => {
    const log = context.logger.start('totalTeamMembers')

    const myTeam = await teams.getTeam(employee)

    return myTeam.length
}

exports.process = async (data, insight, context) => {
    const log = context.logger.start('process')

    const employee = await employees.get(data.id, context)

    const supervisor = employee.supervisor

    const teamCount = await myTeamCount(supervisor, context)

    const query = {
        date: {
            $gte: moment().startOf('day').toDate(),
            $lt: moment().endOf('day').toDate()
        },
        employee: supervisor
    }

    const model = {
        date: moment().startOf('day').toDate(),
        employee: supervisor
    }

    const insightSummary = await insightSummaries.findOrCreate(query, model, context)

    let updateModel = {
        my: [{
            insight: insight.id,
            values: [{
                key: 'team',
                value: teamCount
            }],
            notes: 'Total Team Count For a Day'
        }]
    }

    await insightSummaries.update(insightSummary.id, updateModel, context)

    return Promise.resolve(null)
}
