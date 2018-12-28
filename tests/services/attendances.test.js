'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
require('sinon-mongoose');

let testData = require('../testData');
let db = require('../../models');



describe('attendances service', function () {
    let service = require('../../services/attendances');

    beforeEach(function () {});
    afterEach(function () {});


    describe('updateByTimeLog function', function () {

        let timeLog = testData.timeLog.new();
        // it('should retun attendance with status present', function () {
        //     return service.updateByTimeLog(timeLog, {}).then();
        // });
    });
});