let mongoose = require('mongoose')
let findOrCreate = require('findorcreate-promise')

let tagType = new mongoose.Schema({
    name: String,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },

    created_At: { type: Date, default: Date.now },
    timeStamp: { type: Date, default: Date.now }
})
tagType.pre('save', function (next) {
    this.timeStamp = Date.now()
    next()
})

tagType.plugin(findOrCreate)
mongoose.model('tagType', tagType)
