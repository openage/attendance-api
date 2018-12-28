'use strict';
process.env.NODE_ENV = 'test';
global.Promise = require('bluebird');
global.processSync = true;

if (!global._tests_setup) {
    // require('../settings/database').configure();
    require('../helpers/toObjectId');
    require('../helpers/string');

    console.log('bootstrapping');
    global._tests_setup = true;
}