'use strict'

const extractCheckIn = (entity) => {
    if (!entity) {
        return {}
    }
    return entity._doc
        ? {
            early: entity.early || 0,
            late: entity.late || 0
        } : {
            early: entity.early || 0,
            late: entity.late || 0
        }
}
const extractCheckOut = (entity) => {
    if (!entity) {
        return {}
    }
    return entity._doc
        ? {
            early: entity.early || 0,
            late: entity.late || 0
        } : {
            early: entity.early || 0,
            late: entity.late || 0
        }
}
exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (!entity._doc && !entity.code) {
        return {
            id: entity.toString()
        }
    }
    var model = {
        id: entity._id,
        name: entity.name,
        code: entity.code,
        color: entity.color || '#000000',
        isDynamic: entity.isDynamic,
        autoExtend: entity.autoExtend,
        unitsPerDay: entity.unitsPerDay,
        startTime: entity.startTime,
        endTime: entity.endTime,
        breakTime: entity.breakTime,
        department: entity.department,
        monday: entity.monday,
        tuesday: entity.tuesday,
        wednesday: entity.wednesday,
        thursday: entity.thursday,
        friday: entity.friday,
        saturday: entity.saturday,
        sunday: entity.sunday,
        status: entity.status
        // grace: {
        //     checkIn: {
        //     early: entity.grace.checkIn.early || 0,
        //     late: entity.grace.checkIn.late || 0
        //     },
        //     checkOut: {
        //         early: entity.grace.checkOut.early || 0,
        //         late: entity.grace.checkOut.late || 0
        //     }
        // }
    }
    if (entity.grace) {
        model.grace = {
            checkIn: extractCheckIn(entity.grace.checkIn),
            checkOut: extractCheckOut(entity.grace.checkOut)
        }
    } else {
        model.grace = {
            checkIn: extractCheckIn(0),
            checkOut: extractCheckOut(0)
        }
    }
    // if (entity.grace.checkIn) {
    //     model.grace.checkIn = {
    //         early: entity.grace.checkIn.early,
    //         late: entity.grace.checkIn.late
    //     }
    // }
    // if (entity.grace.checkOut) {
    //     model.grace.checkOut={
    //         early: entity.grace.checkOut.early,
    //         late: entity.grace.checkOut.late
    //     }

    // }
    // }

    // if (entity.organization) {
    //     if (entity.organization._doc) {
    //         model.organization = {
    //             id: entity.organization.id,
    //             name: entity.organization.name,
    //             code: entity.organization.code
    //         };
    //     } else {
    //         model.organization = {
    //             id: entity.organization.toString()
    //         };
    //     }
    // }
    return model
}

exports.toSummary = (entity, context) => {
    if (!entity) {
        return
    }

    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }

    var model = {
        id: entity._id,
        name: entity.name,
        code: entity.code,
        color: entity.color || '#000000',
        isDynamic: entity.isDynamic,
        startTime: entity.startTime,
        endTime: entity.endTime,
        monday: entity.monday,
        tuesday: entity.tuesday,
        wednesday: entity.wednesday,
        thursday: entity.thursday,
        friday: entity.friday,
        saturday: entity.saturday,
        sunday: entity.sunday,
        status: entity.status

    }
    return model
}

exports.toSearchModel = (entities, context) => {
    return entities.map(entity => {
        return exports.toModel(entity, context)
    })
}
