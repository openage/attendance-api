exports.canCreate = async (req) => {
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
