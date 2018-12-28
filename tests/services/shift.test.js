'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
require('sinon-mongoose');

let testData = require('../testData');
let db = require('../../models');

describe('shifts service', function () {
    let service = require('../../services/shifts');

    beforeEach(function () {});
    afterEach(function () {});


    describe('getByTime function', function () {
        let time = new Date("2017-07-11T03:36:08.000Z");
        // it('should return attendance with status present', function () {
        //     return service.getByTime(time, testData.shiftType.new()).then(shift=>{
        //         expect(shift).is.not.null();
        //     });
        // });
    });
});