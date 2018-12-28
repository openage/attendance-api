'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
require('sinon-mongoose');

let testData = require('../testData');
let db = require('../../models');
let communications = require('../../services/communications');

describe('attendances service - calculateHoursWorked function', function () {
    let service = require('../../services/attendances');

    beforeEach(function () {});

    afterEach(function () {});

    it('should return worked for 0 hrs', function () {
        // testData.timeLog.new('03:00', 'checkIn'),
        expect(service.clockedMinutes(testData.attendance.new())).to.equal(0);
    });

    it('should return worked for 4.5 hrs', function () {

        let checkIn = testData.timeLog.new('03:00', 'checkIn');
        let attendance = testData.attendance.new();
        attendance.status = 'checkedIn';
        attendance.checkIn = checkIn.time;
        attendance.recentMostTimeLog = checkIn;
        attendance.timeLogs.push(checkIn);
        //testData.timeLog.new('07:30', 'checkOut'), 
        expect(service.clockedMinutes(attendance)).to.equal(4.5);
    });
});
