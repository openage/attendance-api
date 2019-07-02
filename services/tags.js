'use strict'
const logger = require('@open-age/logger')('services.tags')
const db = require('../models')

const getTag = async (name, type, context) => {
    let tagType = await db.tagType.findOrCreate({
        name: type.toLowerCase(),
        organization: context.organization
    })

    let tag = await db.tag.findOrCreate({
        name: name.toLowerCase(),
        tagType: tagType.result,
        status: 'active',
        organization: context.organization
    })

    return tag.result
}

exports.extractFromEmployee = async (employeeModel, context) => {
    let tags = []

    if (employeeModel.department && employeeModel.department.name) {
        let departmentTag = await getTag(employeeModel.department.name, 'department', context)
        tags.push(departmentTag)
    }

    if (employeeModel.userType && employeeModel.userType.name) {
        let userTypeTag = await getTag(employeeModel.userType.name, 'userType', context)
        tags.push(userTypeTag)
    }

    if (employeeModel.designation && employeeModel.designation.name) {
        let designationTag = await getTag(employeeModel.designation.name, 'designation', context)
        tags.push(designationTag)
    }

    if (employeeModel.gender && employeeModel.gender.name) {
        let genderTag = await getTag(employeeModel.gender.name, 'gender', context)
        tags.push(genderTag)
    }

    return tags
}
