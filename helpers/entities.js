'use strict'

exports.toEntity = (item, type) => {
    let entity = {
        id: item.id,
        type: type
    }

    switch (type) {
    case 'attendance':
        entity.picData = item.employee.picData
        entity.picUrl = item.employee.picUrl
        break
    case 'employee':
        entity.picData = item.picData
        entity.picUrl = item.picUrl
        entity.name = item.name
        entity.phone = item.phone
        break
    case 'location':
        entity.picData = item.picData
        entity.picUrl = item.picUrl
        entity.name = item.name
        entity.phone = item.phone
        entity.coordinates = item.coordinates
        break
    case 'noLeaveTaken':
        entity.picData = item.picData
        entity.picUrl = item.picUrl
        entity.name = item.name
        entity.lastDays = item.lastDays
        entity.date = item.date
        break
    default:
        break
    }

    return entity
}
