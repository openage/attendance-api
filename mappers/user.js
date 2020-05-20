const shiftTypeMapper = require('./shiftType')

const profileMapper = (profile, context) => {
    profile = profile || {}
    profile.pic = profile.pic || {}
    return {
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender,
        pic: {
            url: profile.pic.url,
            thumbnail: profile.pic.thumbnail
        }
    }
}

exports.toModel = (entity, context) => {
    const model = {
        id: entity.id,
        code: entity.code,
        email: entity.email,
        phone: entity.phone,
        profile: profileMapper(entity.profile, context),
        role: { id: entity.role.id },
        biometricCode: entity.biometricCode,
        meta: entity.meta,
        config: entity.config,
        shiftType: shiftTypeMapper.toSummary(entity.shiftType, context),
        status: entity.status
    }

    if (entity.weeklyOff) {
        model.weeklyOff = {
            monday: entity.weeklyOff.monday,
            tuesday: entity.weeklyOff.tuesday,
            wednesday: entity.weeklyOff.wednesday,
            thursday: entity.weeklyOff.thursday,
            friday: entity.weeklyOff.friday,
            saturday: entity.weeklyOff.saturday,
            sunday: entity.weeklyOff.sunday,
            isConfigured: !!entity.weeklyOff.isConfigured
        }
    }

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

    return {
        id: entity.id,
        code: entity.code,
        profile: profileMapper(entity.profile),
        role: { id: entity.role.id }
    }
}
