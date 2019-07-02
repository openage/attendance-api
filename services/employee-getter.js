const db = require('../models')
exports.get = async (query, context) => {
    let log = context.logger.start('services/employees:get')
    let where = {
        organization: context.organization
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.employee.findById(query).populate('supervisor')
        }
        where.code = query
        return db.employee.findOne(where).populate('supervisor')
    }
    if (query.id) {
        return db.employee.findById(query._bsontype === 'ObjectID' ? query.toString() : query.id).populate('supervisor')
    }

    if (query.code) {
        where.code = query.code
        return db.employee.findOne(where).populate('supervisor')
    }

    let error = new Error(`invalid query '${query}'`)
    log.error(error)

    throw error
}

const buildWhere = (params, context) => {
    let where = {
        organization: context.organization,
        status: 'active'
    }

    if (params.name) {
        where.name = {
            $regex: params.name,
            $options: 'i'
        }
    }

    if (params.code) {
        where.code = {
            $regex: params.code,
            $options: 'i'
        }
    }

    if (params.supervisorId) {
        where.supervisor = global.toObjectId(params.supervisorId)
    }

    if (params.shiftTypeId) {
        let shiftIds = []
        let queryShifts = params.shiftTypeId.split(',')
        queryShifts.forEach(shift => {
            shiftIds.push(global.toObjectId(shift))
        })
        where.shiftType = {
            $in: shiftIds
        }
    }

    if (params.departments) {
        let departmentList = []
        let queryDepartmentList = params.departments.split(',')
        queryDepartmentList.forEach((department) => {
            departmentList.push(department.toLowerCase())
        })
        where.department = {
            $in: departmentList
        }
    }

    if (params.contractors) {
        let contractorList = []
        let queryContractorsList = params.contractors.split(',')
        queryContractorsList.forEach((contract) => {
            contractorList.push(contract.toLowerCase())
        })
        where.contractor = {
            $in: contractorList
        }
    }

    if (params.divisions) {
        let divisionList = []
        let queryDivisionList = params.divisions.split(',')
        queryDivisionList.forEach((division) => {
            divisionList.push(division.toLowerCase())
        })
        where.division = {
            $in: divisionList
        }
    }

    if (params.designations) {
        let designationList = []
        let queryDesignationList = params.designations.split(',')
        queryDesignationList.forEach((designation) => {
            designationList.push(designation.toLowerCase())
        })
        where.designation = {
            $in: designationList
        }
    }

    if (params.status) {
        let statusList = []
        let queryStatusList = params.status.split(',')
        queryStatusList.forEach((status) => {
            statusList.push(status.toLowerCase())
        })
        where.status = {
            $in: statusList
        }
    }
    if (params.userTypes) {
        let userTypesList = []
        let queryUserTypesList = params.userTypes.split(',')
        userTypesList = queryUserTypesList.map(item => item)
        where['userType'] = {
            $in: userTypesList
        }
    }

    return where
}

exports.search = async (query, paging, context) => {
    const where = buildWhere(query, context)

    if (paging && paging.limit) {
        return db.employee.find(where)
            .sort({
                name: 1
            })
            .skip(paging.skip).limit(paging.limit)
    } else {
        return db.employee.find(where)
            .sort({
                name: 1
            })
    }
}

exports.count = async (query, context) => {
    const where = buildWhere(query, context)

    return db.employee.find(where).count()
}
