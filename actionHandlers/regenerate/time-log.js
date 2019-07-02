
const db = require('../../models')
const attendanceService = require('../../services/attendances')

exports.process = async (data, context) => {
    let timeLogs = await db.timeLog.find({
        time: {
            $gt: data.from,
            $lt: data.till
        },
        organization: context.organization
    })

    for (const timeLog of timeLogs) {
        await attendanceService.updateByTimeLog(timeLog, context)
    }
}
