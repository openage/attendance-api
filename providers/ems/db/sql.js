'use strict'
var async = require('async')
var mysql = require('./mysql-connection')

var _ = require('underscore')

exports.updateFields = function (data) {
    var changedFields = []
    var index
    var field
    var newValue

    for (index in data.fields) {
        field = data.fields[index]

        newValue = data.newValues[field]
        if (data.modelObj[field] !== newValue) {
            changedFields.push(field)
            data.modelObj[field] = newValue
        }
    }

    return changedFields
}

/**
 * a SELECT clause builder
 * @param {String} tableName - the name of table to fetch FROM
 * @returns {Object}
 */

exports.selectBuilder = function (tableName) {
    var builder = {}

    var columns = []

    builder.add = function (param1, param2) {
        var column = {}
        if (arguments.length === 1) {
            column.name = param1
        } else {
            column.name = param2
            column.as = param1
        }
        columns.push(column)

        return builder
    }

    builder.build = function () {
        if (!columns.length) {
            return tableName ? ' SELECT * FROM ' + tableName : ' SELECT * '
        }

        var clause = ' SELECT '

        for (var i = 0; i < columns.length; i++) {
            clause = clause + columns[i].name + (columns[i].as ? ' AS ' + columns[i].as : '')

            if (i !== columns.length - 1) {
                clause = clause + ', '
            }
        }
        clause = tableName ? clause + ' FROM ' + tableName + ' ' : clause
        return clause
    }

    return builder
}

/**
 * a LIMIT cause builder to be clubbed with SELECT
 * @param {Object} input - can be passed req.query
 * @param {Number} input.page - the page no to fetch (defaults to 1)
 * @param {Number} input.size - the no of records to fetch (defaults to 10)
 * @param {Boolean} input.noPaging - if paging needs to be skipped
 * @param {Object} defaults
 * @param {Object} defaults.no - to be used if input.page is missing
 * @param {Object} defaults.size - to be used if input.pageSize is missing
 * @returns {Number} no - the currentPage
 * @returns {Number} size - the no of records to fetch
 * @returns {Boolean} noPaging - if paging needs to be appied
 * @returns {function} build - to get the WHERE clause
 */
exports.pagingBuilder = function (input, defaults) {
    input = input || {}

    var builder = {
        no: input.page || (defaults && defaults.no ? defaults.no : 1),
        size: input.pageSize || (defaults && defaults.size ? defaults.size : 10)
    }

    if (input.noPaging === 'true' || input.noPaging === true) {
        builder.no = 1
        builder.size = 1000000
        builder.noPaging = true
    }

    builder.offset = (builder.no - 1) * builder.size
    /**
         * converts the count to no of pages
         * @param {Number} count
         * @returns {Number} - number of pages
         */
    builder.totalPages = function (count) {
        if (builder.noPaging) {
            return 1
        }
        return Math.ceil(count / builder.size)
    }

    /**
     * builds the LIMIT clause
     * @returns {String}
     */
    builder.build = function () {
        return builder.noPaging ? '' : ' LIMIT ' + builder.size + ' OFFSET ' + builder.offset + ' '
    }

    return builder
}

/**
 * a where cause builder that gives out where clause to be clubbed with select
 * @returns {function} add - method to add the AND condition
 * @returns {function} push -  method to add the AND condition
 * @returns {function} if - to conditionally ignore the subseqent add() or push()
 * @returns {function} build - to get the WHERE clause
 */
exports.whereBuilder = function () {
    var builder = {}

    builder.filters = []

    builder.push = function (obj) {
        if (obj.value) {
            builder.filters.push(obj)
        }
        return builder
    }

    /**
     * adds the condition to be added to WHERE clause
     * @param {String} field - the db column
     * @param {Any} value - the condtion is ignored if it is falsey
     * @param {String|Undefined} operation - defaults to '='
     * @returns {Object} the builder
     */
    builder.add = function (field, value, operater) {
        if (!value) {
            return builder
        }

        builder.filters.push({
            field: field,
            value: value,
            op: operater || '='
        })

        return builder
    }

    builder.concat = function (condition) {
        builder.filters.push(condition)
        return builder
    }

    /**
     * checks for condition
     * @param {function|Any} condtion - if falsey subseqent add or push methods are ignored
     * @returns {Object} the builder
     */
    builder.if = function (condition) {
        if (typeof (condition) === 'function' ? condition() : condition) {
            return builder
        }

        return {
            add: function () {
                return builder
            },
            push: function () {
                return builder
            }
        }
    }

    /**
     * builds and returns the WHERE clause
     * @returns {String} whereClause
     */
    builder.build = function () {
        if (builder.filters.length === 0) {
            return ''
        }
        var clause = ' WHERE '
        for (var i = 0; i < builder.filters.length; i++) {
            if (builder.filters[i].op === 'in' || builder.filters[i].op === 'not in') {
                clause = clause +
                    builder.filters[i].field + ' ' +
                    builder.filters[i].op +
                    ' ' + builder.filters[i].value + ' '
            } else if (builder.filters[i].field) {
                clause = clause +
                    builder.filters[i].field + ' ' +
                    builder.filters[i].op +
                    ' \'' + builder.filters[i].value + '\' '
            } else {
                clause = clause + builder.filters[i]
            }

            if (i !== builder.filters.length - 1) {
                clause = clause + ' AND '
            }
        }
        return clause
    }

    return builder
}

/**
 * fetches data from the db
 * @param {String} dataQuery The query to run to get items
 * @param {Object} paging - used for paging to return page object (can pass pagingBuilder object)
 * @param {Number} paging.no
 * @param {Number} paging.size
 * @returns {Array} items
 * @returns {Number} totalPages
 * @returns {Number} currentPage
 */
exports.fetchPagedData = function (dataQuery, callback) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function (cb) {
                mysql.getConnection(function (err, conn) {
                    cb(err, conn)
                })
            },
            function (conn, cb) {
                conn.query(dataQuery, function (err, rows) {
                    conn.release()
                    if (err) {
                        return cb(err)
                    }
                    cb(null, rows.map(function (item) {
                        return item
                    }))
                })
            }
        ], function (err, items) {
            if (err) {
                reject(err)
                if (callback) {
                    callback(err)
                }
                return
            }

            let result = {
                items: items
            }

            resolve(result)
            if (callback) {
                callback(null, result)
            }
        })
    })
}

exports.getCount = function (countQuery, callback) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function (cb) {
                mysql.getConnection(function (err, conn) {
                    cb(err, conn)
                })
            },
            function (conn, cb) {
                conn.query(countQuery, function (err, rows) {
                    conn.release()
                    if (err) {
                        return cb(err)
                    }
                    cb(null, rows[0].count)
                })
            }
        ], function (err, count) {
            if (err) {
                reject(err)
                if (callback) {
                    callback(err)
                }
                return
            }

            resolve(count)
            if (callback) {
                callback(null, count)
            }
        })
    })
}
