'use strict'
var mongo = require('mongodb')

const getConnection = (host) => {
    return new Promise((resolve, reject) => {
        mongo.MongoClient.connect(host, function (err, connection) {
            if (err) { return reject(err) }
            resolve(connection)
        })
    })
}

const aggregateArray = function (host, database, collection, finder) {
    return getConnection(host).then(connection => {
        return new Promise((resolve, reject) => {
            connection.db(database).collection(collection).aggregate(finder).toArray(function (err, rows) {
                connection.close()
                if (err) {
                    return reject(err)
                }
                resolve(rows)
            })
        })
    })
}

// var db = require()
// db('directory).collection('employees').aggregate([]).then(list=> {
// })
exports.db = (provider) => {
    var dbConfig = require('config').get(`providers.${provider}`).dbServer
    return {
        collection: (name) => {
            return {
                aggregate: (finder) => {
                    return aggregateArray(dbConfig.host, dbConfig.database, name, finder)
                }
            }
        }
    }
}
