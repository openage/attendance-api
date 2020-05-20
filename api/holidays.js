let mapper = require('../mappers/holiday')
const service = require('../services/holidays')

const api = require('./api-base')('holidays', 'holiday')

api.getByDate = async (req) => {
    let entity = await service.get({ date: req.params.date }, req.context)
    return mapper.toModel(entity, req.context)
}

module.exports = api
