'use strict'
const auth = require('../middleware/authorization')
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

    app.get('/logs', function (req, res) {
        var filePath = appRoot + '/' + loggerConfig.file.filename

        fs.readFile(filePath, function (err, data) {
            res.contentType('application/json')
            res.send(data)
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
            filter: [auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'update',
            url: '/employee/update',
            filter: [auth.requiresOrg]
        }])

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
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('shiftTypes')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/byDate',
            method: 'getByDate',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'DELETE',
            url: '/:id',
            method: 'delete',
            filter: [auth.requiresOrg]
        }])

    api.model('channelTypes')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('channels')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('alertTypes')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search'
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get'
        }])

    api.model('alerts')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('alerts')
        .register({
            action: 'PUT',
            method: 'subscribeAlert',
            url: '/subscribe/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        })

    api.model('devices')
        .register([{
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/:id',
            method: 'get',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'syncTimeLogs',
            url: '/:deviceId/logs',
            filter: [auth.requiresToken]
        }])

    api.model('categories')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('machines')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('deviceTypes')
        .register('REST')

    api.model('effectiveShifts')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
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
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getRosterShiftExcel',
            url: '/roster/excelFormat',
            filter: [auth.requiresToken, auth.requiresOrg]
        }

        ])

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
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'searchInTeam',
            url: '/from/team',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getSupervisor',
            url: '/get/supervisor/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getEmpByAdmin',
            url: '/forAdmin/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getEmployeesBirthdays',
            url: '/get/birthdays',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'uploadNightShifters',
            url: '/uploadNightShifters/:shiftType',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'syncEmployees',
            url: '/sync/updates',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'notTakenLeaves',
            url: '/leaves/notTaken',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'linksMagic',
            url: '/get/linksMagic/:guid'
        }, {
            action: 'POST',
            method: 'magicLink',
            url: '/create/magicLink'
        }, {
            action: 'POST',
            method: 'fingerRegistration',
            url: '/:id/fingerPrint',
            filter: [auth.requiresToken]
        }, {
            action: 'PUT',
            method: 'updateFingerMark',
            url: '/:id/fingerPrint',
            filter: [auth.requiresToken]
        }, {
            action: 'GET',
            method: 'getFingerMarks',
            url: '/:id/fingerPrint',
            filter: [auth.requiresToken]
        }])

    api.model('shifts')
        .register([{
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('attendances')
        .register([{
            action: 'GET',
            method: 'getSingleDayAttendancesExcel',
            url: '/dayReport',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getAttendanceLogs',
            url: '/:id/logs',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'LocationLogsByDate',
            url: '/:id/getLocations',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getLocationLogs',
            url: '/:id/locationLogs',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'singleEmployeeMonthlyReport',
            url: '/monthReport',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getOneDayAttendances',
            url: '/getOneDayAttendances',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'attendanceExtractor',
            url: '/extractor',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'attendanceMonthlyPdf',
            url: '/monthlyPdf',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'summary',
            url: '/:id/summary',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getMonthlySummary',
            url: '/employee/month/summary',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'upadteTeamInAttendance',
            url: '/update/team/in/attendance',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'deleteTeamInAttendance',
            url: '/delete/team/in/attendance',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'regenerate',
            url: '/regenerate',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'updateByExtServer',
            url: '/byExtServer/:empCode',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'markAbsentAttendance',
            url: '/markAbsent',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'trackLocation',
            url: '/:id/addLocation',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'updateHoursWorked',
            url: '/update/hours/worked',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'getCurrentDate',
            url: '/current/date',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'extendShift',
            url: '/:id/extendShift',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('holidays')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:date',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('leaveTypes')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('teams')
        .register({
            action: 'Get',
            url: '/:id/teamMembers',
            method: 'getMyTeam',
            filter: [auth.requiresToken, auth.requiresOrg]
        })

    api.model('leaves')
        .register([{
            action: 'PUT',
            url: '/:id/action',
            method: 'actionOnLeave',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'createMultiple',
            url: '/many',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'get',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'DELETE',
            method: 'delete',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/my/teamLeaves',
            method: 'myTeamLeaves',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/my/organization',
            method: 'organizationLeaves',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('leaveBalances')
        .register([{
            action: 'POST',
            method: 'leaveBalanceExtractorByExcel',
            url: '/importer/excel',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'createForMany',
            url: '/forMany',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'update',
            url: '/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        },
            //  {
            //     action: 'GET',
            //     method: 'search',
            //     filter: [auth.requiresToken, auth.requiresOrg]
            // },
        {
            action: 'GET',
            method: 'getCurrentYearBal',
            // url: '/employee/:id',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'organizationLeaveBalances',
            url: '/my/organization',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'multiUpdateBalance',
            url: '/multi/:employee',
            filter: [auth.requiresToken, auth.requiresOrg]
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
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'POST',
            method: 'bulk',
            url: '/bulk',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('notifications')
        .register([{
            action: 'DELETE',
            method: 'delete',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'PUT',
            method: 'archive',
            url: '/:id/archive/:employee',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('messages')
        .register([{
            action: 'POST',
            method: 'reportBug',
            url: '/reportBug',
            filter: [auth.requiresToken, auth.requiresOrg]
        }])

    api.model('deviceLogs')
        .register([{
            action: 'POST',
            method: 'create',
            filter: [auth.requiresToken, auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresOrg]
        }])

    api.model('tags')
        .register([{
            action: 'GET',
            method: 'get',
            url: '/:id'
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            url: '/byType/:id',
            method: 'tagsByTagType',
            filter: [auth.requiresOrg]
        }])

    api.model('tagTypes')
        .register([{
            action: 'GET',
            method: 'get',
            url: '/:id'
        }, {
            action: 'POST',
            method: 'create',
            filter: [auth.requiresOrg]
        }, {
            action: 'GET',
            method: 'search',
            filter: [auth.requiresOrg]
        }])

    api.model('reportRequests')
        .register('REST', [auth.requiresToken, auth.requiresOrg])

    api.model('systems')
        .register([{
            action: 'GET',
            method: 'usage',
            url: '/usage'
        }])

    api.model('tasks')
        .register('REST', [auth.requiresToken])

    logger.end()
}
