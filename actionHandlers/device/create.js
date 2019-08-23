exports.process = async (data, context) => {
    context.organization.devicesVersion = context.organization.devicesVersion ? (Number(context.organization.devicesVersion) + 1).toString() : '1'
    return context.organization.save()
}
