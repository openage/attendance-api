var appRoot = require('app-root-path')

var offline = require('@open-age/offline-processor')

exports.process = async (task, context) => {
    task.status = 'in-progress'
    await task.save()
    try {
        switch (task.assignedTo) {
        case 'job':
            let job = require(`${appRoot}/jobs/${task.entity}`)
            await job.run([context.organization.code], new Date(task.data))
            task.status = 'done'
            break

        case 'processor':
            context.task = task
            await offline.queue(task.entity, task.action, task.meta, context)
            task.status = 'done'
            break

        case 'sync-service':
            context.task = task
            task.status = 'new'
            break

        default:
            task.status = 'invalid'
            task.error = `assignedTo: '${task.assignedTo}' is not implement`
            break
        }

        await task.save()
    } catch (err) {
        task.status = 'error'
        task.error = {
            message: err.message || err,
            stack: err.stack
        }
        await task.save()
    }
}
