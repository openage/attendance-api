'use strict'
const auth = require('../helpers/auth')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const loggerConfig = require('config').get('logger')
const appRoot = require('app-root-path')
const specs = require('../specs')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')
    app.get('/', (req, res) => {
        res.render('index', {
            title: '~ THIS IS AMS API ~'
        })
    })

    app.get('/swagger', (req, res) => {
        res.writeHeader(200, {
            'Content-Type': 'text/html'
        })
        fs.readFile('./public/swagger.html', null, function (err, data) {
            if (err) {
                res.writeHead(404)
            }
            res.write(data)
            res.end()
        })
    })

    app.get('/specs', function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            res.contentType('text/html')
            res.send(data)
        })
    })

    app.get('/reports/:file', function (req, res) {
        var fileName = req.params.file
        let filePath = `${appRoot}/temp/${fileName}`
        res.download(filePath)
    })

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    app.get('/api/versions/current', function (req, res) {
        var filePath = appRoot + '/version.json'

        fs.readFile(filePath, function (err, data) {
            res.contentType('application/json')
            res.send(data)
        })
    })

    var api = apiRoutes(app)

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
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'update',
            url: '/employee/update',
            filter: [auth.requiresToken]
        }])

    api.model('logs')
        .register('REST', [auth.requiresToken])

    api.model('insights')
        .register([{
            action: 'GET',
            method: 'search',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getInsightByAlert',
            url: '/:id/daily/:date',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getAlert',
            url: '/:id/notification',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getAlert',
            url: '/:id/report',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getReports',
            url: '/:id/report/list',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'POST',
            method: 'createReport',
            url: '/:id/report',
            filter: [auth.requiresOrg, auth.requiresToken]
        }, {
            action: 'POST',
            method: 'getEmployees',
            url: '/:id/daily/:date',
            filter: [auth.requiresOrg, auth.requiresToken]
        }])

    api.model('syncs')
        .register({
            action: 'GET',
            method: 'getVersions',
            url: '/version',
            filter: [auth.requiresOrg, auth.requiresToken]
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
            url: '/:id'
        }, {
            action: 'POST',
            method: 'create'
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken]
        }])

    api.model('shiftTypes')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/byDate',
            method: 'getByDate',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            filter: [auth.requiresToken]
        }, {
            action: 'DELETE',
            url: '/:id',
            method: 'delete',
            filter: [auth.requiresToken]
        }])

    api.model('channelTypes')
        .register('REST', [auth.requiresToken])

    api.model('channels')
        .register('REST', [auth.requiresToken])

    api.model('alertTypes')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search'
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get'
        }])

    api.model('alerts')
        .register('REST', [auth.requiresToken])

    api.model('alerts')
        .register({
            action: 'PUT',
            method: 'subscribeAlert',
            url: '/subscribe/:id',
            filter: [auth.requiresToken]
        })

    api.model('devices')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'setStatus',
            url: '/:id/status',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'setLastSyncTime',
            url: '/:id/lastSyncTime',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'setLastSyncTime',
            url: '/lastSyncTime',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            filter: [auth.requiresToken]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'syncTimeLogs',
            url: '/:deviceId/logs',
            filter: [auth.requiresToken]
        }])

    api.model('categories')
        .register('REST', [auth.requiresToken])

    api.model('machines')
        .register('REST', [auth.requiresToken])

    api.model('deviceTypes')
        .register('REST')

    api.model('effectiveShifts')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'reset',
            url: '/reset',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'updateShiftWithXl',
            url: '/shiftUpdate/xl',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getRosterShiftExcel',
            url: '/roster/excelFormat',
            filter: [auth.requiresToken]
        }])

    api.model('biometrics').register('REST', auth.requiresToken)

    api.model('employees')
        .register([{
            action: 'POST',
            method: 'createWithTunnel',
            url: '/makeTunnel',
            filter: auth.requiresOrg
        }, {
            action: 'POST',
            method: 'createWithExternalToken',
            filter: auth.requiresOrg
        }, {
            action: 'POST',
            method: 'create', // for ems
            url: '/fromEms',
            filter: auth.requiresOrg
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'searchInTeam',
            url: '/from/team',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getSupervisor',
            url: '/get/supervisor/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getEmpByAdmin',
            url: '/forAdmin/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getEmployeesBirthdays',
            url: '/get/birthdays',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'uploadNightShifters',
            url: '/uploadNightShifters/:shiftType',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'syncEmployees',
            url: '/sync/updates',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'notTakenLeaves',
            url: '/leaves/notTaken',
            filter: [auth.requiresToken]
        }])

    api.model('shifts')
        .register([{
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }])

    api.model('attendances')
        .register([{
            action: 'GET',
            method: 'getSingleDayAttendancesExcel',
            url: '/dayReport',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getAttendanceLogs',
            url: '/:id/logs',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'LocationLogsByDate',
            url: '/:id/getLocations',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getLocationLogs',
            url: '/:id/locationLogs',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'singleEmployeeMonthlyReport',
            url: '/monthReport',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getOneDayAttendances',
            url: '/getOneDayAttendances',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'continueShift',
            url: '/:id/continue',
            filter: [auth.requiresToken]
        },
        {
            action: 'GET',
            method: 'attendanceExtractor',
            url: '/extractor',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'attendanceMonthlyPdf',
            url: '/monthlyPdf',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'summary',
            url: '/:id/summary',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getMonthlySummary',
            url: '/employee/month/summary',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'upadteTeamInAttendance',
            url: '/update/team/in/attendance',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'deleteTeamInAttendance',
            url: '/delete/team/in/attendance',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'regenerate',
            url: '/regenerate',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'updateByExtServer',
            url: '/byExtServer/:empCode',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'markAbsentAttendance',
            url: '/markAbsent',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'trackLocation',
            url: '/:id/addLocation',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'updateHoursWorked',
            url: '/update/hours/worked',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getCurrentDate',
            url: '/current/date',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'extendShift',
            url: '/:id/extendShift',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'clearAction',
            url: '/:id/clearAction',
            filter: [auth.requiresToken]
        }])

    api.model('holidays')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:date',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }])

    api.model('leaveTypes')
        .register('REST', [auth.requiresToken])

    api.model('teams')
        .register({
            action: 'Get',
            url: '/:id/teamMembers',
            method: 'getMyTeam',
            filter: [auth.requiresToken]
        })

    api.model('leaves')
        .register([{
            action: 'PUT',
            url: '/:id/action',
            method: 'actionOnLeave',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/my/teamLeaves',
            method: 'myTeamLeaves',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/my/organization',
            method: 'organizationLeaves',
            filter: [auth.requiresToken]
        }])

    api.model('leaveBalances')
        .register([{
            action: 'POST',
            method: 'leaveBalanceExtractorByExcel',
            url: '/importer/excel',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'createForMany',
            url: '/forMany',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'runOvertimeRule',
            url: '/run-overtime-rule',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'grant',
            url: '/:id/grant',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'organizationLeaveBalances',
            url: '/my/organization',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'multiUpdateBalance',
            url: '/multi/:employee',
            filter: [auth.requiresToken]
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
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'move',
            url: '/move',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken]
        }, {
            action: 'POST',
            method: 'regenerate',
            url: '/regenerate',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }])

    api.model('notifications')
        .register([{
            action: 'DELETE',
            method: 'delete',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'archive',
            url: '/:id/archive/:employee',
            filter: [auth.requiresToken]
        }])

    api.model('messages')
        .register([{
            action: 'POST',
            method: 'reportBug',
            url: '/reportBug',
            filter: [auth.requiresToken]
        }])

    api.model('deviceLogs')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }])

    api.model('tags')
        .register([{
            action: 'GET',
            method: 'get',
            url: '/:id'
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            url: '/byType/:id',
            method: 'tagsByTagType',
            filter: [auth.requiresToken]
        }])

    api.model('tagTypes')
        .register([{
            action: 'GET',
            method: 'get',
            url: '/:id'
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken]
        }])

    api.model('reportRequests')
        .register('REST', [auth.requiresToken])

    api.model('systems')
        .register([{
            action: 'GET',
            method: 'usage',
            url: '/usage'
        }])

    api.model('tasks')
        .register('REST', [auth.requiresToken])
        .register([{
            action: 'PUT',
            method: 'run',
            url: '/:id/run',
            filter: [auth.requiresToken]
        }])
    logger.end()
}
