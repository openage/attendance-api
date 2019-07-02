exports.canUpdate = async (req) => {
    if (!req.context.hasPermission('superadmin')) {
        return {
            status: 404,
            code: 'INSUFFICIENT_PERMISSION'
        }
    }
}
