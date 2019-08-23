'use strict'

exports.toModel = (entity, context) => {
    var model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        activeEmployeeCount: entity.activeEmployeeCount,
        neverLoggedInCount: entity.neverLoggedInCount,
        lastAdminLogin: entity.lastAdminLogin ? entity.lastAdminLogin.recentLogin : '',
        lastEmployeeLogin: entity.lastEmployeeLogin ? entity.lastEmployeeLogin.recentLogin : '',
        timeLogsCount: entity.timeLogsCount,
        biometricCount: entity.biometricCount,
        wifiCount: entity.wifiCount,
        lastTimeLog: entity.lastTimeLog ? entity.lastTimeLog.time : ''
    }

    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toSearchModel(entities, context)
    })
}
