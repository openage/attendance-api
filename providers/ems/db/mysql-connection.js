'use strict'
var mysql = require('mysql2')

var dbConfig = require('config').get('providers.ems').dbServer

var pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database
})

var getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        callback(err, connection)
    })
}

var runQuery = function (query) {
    return new Promise((resolve, reject) => {
        getConnection(function (err, conn) {
            if (err) {
                return reject(err)
            }
            conn.query(query, function (err, rows) {
                conn.release()
                if (err) {
                    return reject(err)
                }

                resolve(rows)
            })
        })
    })
}

exports.getConnection = getConnection
exports.runQuery = runQuery
