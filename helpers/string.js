'use strict'
String.prototype.toObjectId = function () {
    var ObjectId = (require('mongoose').Types.ObjectId)
    return new ObjectId(this.toString())
}

String.prototype.isObjectId = function () {
    let ObjectId = require('mongoose').Types.ObjectId
    return ObjectId.isValid(this.toString())
}

global.toObjectId = id => require('mongoose').Types.ObjectId(id)
