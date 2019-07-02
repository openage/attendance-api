exports.canCreate = async (req) => {
    if (!req.context.hasPermission(['superadmin', 'organization.owner', 'leave-types.create'])) {
        return {
            status: 404,
            code: 'INSUFFICIENT_PERMISSION'
        }
    }

    let model = req.body

    if (!model.code) {
        return 'code is required'
    }

    if (!model.name) {
        return 'name is required'
    }

    if (!model.unitsPerDay) {
        return 'unitsPerDay is required'
    }

    if (!model.category) {
        return 'category is required'
    }
}

exports.canUpdate = async (req) => {
    if (!req.context.hasPermission(['superadmin', 'organization.owner', 'leave-types.update'])) {
        return {
            status: 404,
            code: 'INSUFFICIENT_PERMISSION'
        }
    }
}

exports.canDelete = async (req) => {
    if (!req.context.hasPermission(['superadmin', 'organization.owner', 'leave-types.delete'])) {
        return {
            status: 404,
            code: 'INSUFFICIENT_PERMISSION'
        }
    }
}
