const db = require('../models')
const userService = require('./employees')
const directory = require('@open-age/directory-client')
const populate = 'shiftType supervisor'

exports.get = async (query, context, create = true) => {
    context.logger.silly('services/employees:get')

    if (!query) {
        return
    }

    let where = {
        organization: context.organization
    }
    let user

    if (query._bsontype === 'ObjectID') {
        query = {
            id: query.toString()
        }
    }

    if (typeof query === 'string') {
        if (query === 'my') {
            query = context.user.id
        }
        if (query.isObjectId()) {
            user = await db.user.findById(query).populate(populate)
        } else {
            where.code = query
            user = await db.user.findOne(where).populate(populate)
        }
    } else if (query.id) {
        if (query.id === 'my') {
            query.id = context.user.id
        }
        user = await db.user.findById(query.id).populate(populate)
    }

    if (!user && query.role && query.role.id) {
        user = await db.user.findOne({
            organization: context.organization,
            'role.id': query.role.id
        }).populate(populate)
    }

    if (!user && query.trackingId) {
        user = await db.user.findOne({
            trackingId: query.trackingId,
            organization: context.organization
        }).populate(populate)
    }

    if (!user && query.code) {
        if (query.code === 'my') {
            query.code = context.user.code
        }
        user = await db.user.findOne({
            organization: context.organization,
            code: query.code.toLowerCase()
        }).populate(populate)
    }

    if (!user && query.biometricCode) {
        user = await db.user.findOne({
            organization: context.organization,
            biometricCode: query.biometricCode,
            status: 'temp'
        }).populate(populate)
    }

    if (create) {
        if (!user) {
            let directoryEmployee = await directory.employees.get(query, context)
            if (directoryEmployee) {
                user = await userService.create(directoryEmployee, context, false)
            }
        }
    }

    return user
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
        return db.user.find(where)
            .sort({
                name: 1
            })
            .skip(paging.skip).limit(paging.limit)
    } else {
        return db.user.find(where)
            .sort({
                name: 1
            })
    }
}

exports.count = async (query, context) => {
    const where = buildWhere(query, context)

    return db.user.find(where).count()
}
