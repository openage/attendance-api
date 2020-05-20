'use strict'
const contextBuilder = require('../helpers/context-builder')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const specs = require('../specs')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    let specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    var api = apiRoutes(app, { context: { builder: contextBuilder.create } })

    api.model('binaries')
        .register({
            action: 'GET',
            method: 'get',
            url: '/:filename'
        })

    api.model('hooks')
        .register([{
            action: 'POST',
            method: 'create',
            url: '/employee/create',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'update',
            url: '/employee/update',
            permissions: 'organization.user'
        }])

    api.model('logs')
        .register('REST', { permissions: 'organization.user' })

    api.model('syncs')
        .register({
            action: 'GET',
            method: 'getVersions',
            url: '/version',
            permissions: 'organization.user'
        })

    api.model('configs')
        .register({
            action: 'GET',
            method: 'get',
            url: '/:filename'
        })

    api.model('organizations')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.admin'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }])

    api.model('shiftTypes')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            url: '/byDate',
            method: 'getByDate',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            permissions: 'organization.user'
        }, {
            action: 'DELETE',
            url: '/:id',
            method: 'delete',
            permissions: 'organization.user'
        }])

    api.model('devices')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'setStatus',
            url: '/:id/status',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'setLastSyncTime',
            url: '/:id/lastSyncTime',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'setLastSyncTime',
            url: '/lastSyncTime',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            permissions: 'organization.user'
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'syncTimeLogs',
            url: '/:deviceId/logs',
            permissions: 'organization.user'
        }])

    api.model('categories')
        .register('REST', { permissions: 'organization.user' })

    api.model('machines')
        .register('REST', { permissions: 'organization.user' })

    api.model('deviceTypes')
        .register('REST')

    api.model('effectiveShifts')
        .register([{
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'reset',
            url: '/reset',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'updateShiftWithXl',
            url: '/shiftUpdate/xl',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getRosterShiftExcel',
            url: '/roster/excelFormat',
            permissions: 'organization.user'
        }])

    api.model('biometrics').register('REST', { permissions: 'organization.user' })
    api.model('users').register('REST', { permissions: 'organization.user' })

    api.model('employees')
        .register([{
            action: 'POST',
            method: 'createWithTunnel',
            url: '/makeTunnel',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'createWithExternalToken',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create', // for ems
            url: '/fromEms',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'merge',
            url: '/:id/merge',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'searchInTeam',
            url: '/from/team',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getSupervisor',
            url: '/get/supervisor/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getEmpByAdmin',
            url: '/forAdmin/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getEmployeesBirthdays',
            url: '/get/birthdays',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'uploadNightShifters',
            url: '/uploadNightShifters/:shiftType',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'syncEmployees',
            url: '/sync/updates',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'notTakenLeaves',
            url: '/leaves/notTaken',
            permissions: 'organization.user'
        }])

    api.model('shifts')
        .register([{
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }])

    api.model('attendances')
        .register([{
            action: 'GET',
            method: 'getSingleDayAttendancesExcel',
            url: '/dayReport',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getAttendanceLogs',
            url: '/:id/logs',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'LocationLogsByDate',
            url: '/:id/getLocations',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getLocationLogs',
            url: '/:id/locationLogs',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'singleEmployeeMonthlyReport',
            url: '/monthReport',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getOneDayAttendances',
            url: '/getOneDayAttendances',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'continueShift',
            url: '/:id/continue',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'attendanceExtractor',
            url: '/extractor',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'attendanceMonthlyPdf',
            url: '/monthlyPdf',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'summary',
            url: '/:id/summary',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getMonthlySummary',
            url: '/employee/month/summary',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'upadteTeamInAttendance',
            url: '/update/team/in/attendance',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'deleteTeamInAttendance',
            url: '/delete/team/in/attendance',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'regenerate',
            url: '/regenerate',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'markAbsentAttendance',
            url: '/markAbsent',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'trackLocation',
            url: '/:id/addLocation',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'updateHoursWorked',
            url: '/update/hours/worked',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getCurrentDate',
            url: '/current/date',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'extendShift',
            url: '/:id/extendShift',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'clearAction',
            url: '/:id/clearAction',
            permissions: 'organization.user'
        }])

    api.model('holidays')
        .register([{
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'getByDate',
            url: 'getByDate/:date',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        },
        {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }])

    api.model('leaveTypes')
        .register([{
            action: 'POST',
            method: 'create',
            permissions: 'organization.admin'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.admin'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            permissions: 'organization.admin'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.admin'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }])

    api.model('leaves')
        .register([{
            action: 'PUT',
            url: '/:id/action',
            method: 'actionOnLeave',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            url: '/my/teamLeaves',
            method: 'myTeamLeaves',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            url: '/my/organization',
            method: 'organizationLeaves',
            permissions: 'organization.user'
        }])

    api.model('leaveBalances')
        .register([{
            action: 'POST',
            method: 'runOvertimeRule',
            url: '/run-overtime-rule',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'grant',
            url: '/:id/grant',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }
        ])

    api.model('timeLogs')
        .register([{
            action: 'GET',
            method: 'downloadSyncSheet',
            url: '/:filename'
        }, {
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'move',
            url: '/move',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            permissions: 'organization.user'
        }, {
            action: 'POST',
            method: 'regenerate',
            url: '/regenerate',
            permissions: 'organization.user'
        }, {
            action: 'GET',
            method: 'search',
            permissions: 'organization.user'
        }])

    api.model('deviceLogs')
        .register([{
            action: 'POST',
            method: 'create',
            permissions: 'organization.user'
        }])

    api.model('systems')
        .register([{
            action: 'GET',
            method: 'usage',
            url: '/usage'
        }])

    api.model('tasks')
        .register('REST', { permissions: 'organization.user' })
        .register([{
            action: 'PUT',
            method: 'run',
            url: '/:id/run',
            permissions: 'organization.admin'
        }])
    logger.end()
}
