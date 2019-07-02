'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
require('sinon-mongoose');

let testData = require('../testData');
let db = require('../../models');
let communications = require('../../services/communications');

describe('attendances service - getAttendanceStatus function', function () {
    let service = require('../../services/attendances');

    beforeEach(function () {});

    afterEach(function () {});

    describe('for attendance checked In at 03:15', function () {
        let checkIn = testData.timeLog.new('03:15', 'checkIn');
        let attendance = testData.attendance.new();
        attendance.status = 'checkedIn';
        attendance.checkIn = checkIn.time;
        attendance.recentMostTimeLog = checkIn;
        attendance.timeLogs.push(checkIn);

        it('should return checkedIn for checkIn at 02:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('02:30', 'checkIn'), attendance)).to.equal('checkedIn');
        });

        it('should return present for checkOut at 04:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('04:30', 'checkOut'), attendance)).to.equal('present');
        });
    });

    describe('for attendance checked Out at 09:45', function () {
        let checkIn = testData.timeLog.new('03:15', 'checkIn');
        let checkOut = testData.timeLog.new('09:45', 'checkOut');
        let attendance = testData.attendance.new();
        attendance.status = 'present';
        attendance.checkIn = checkIn.time;
        attendance.checkOut = checkOut.time;
        attendance.recentMostTimeLog = checkOut;
        attendance.timeLogs.push(checkIn);
        attendance.timeLogs.push(checkOut);

        it('should return present for checkIn at 02:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('02:30', 'checkIn'), attendance)).to.equal('present');
        });

        it('should return present for checkIn at 04:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('04:30', 'checkIn'), attendance)).to.equal('present');
        });

        it('should return checked-in-again for checkIn at 10:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('10:30', 'checkIn'), attendance)).to.equal('checked-in-again');
        });
    });

    describe('for a person on leave', function () {
        let checkIn = testData.timeLog.new('03:15', 'checkIn');
        let checkOut = testData.timeLog.new('09:45', 'checkOut');
        let attendance = testData.attendance.new();
        attendance.status = 'onLeave';
        attendance.checkIn = checkIn.time;
        attendance.checkOut = checkOut.time;
        attendance.recentMostTimeLog = checkOut;
        attendance.timeLogs.push(checkIn);
        attendance.timeLogs.push(checkOut);

        it('should return onLeave for checkIn at 12:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('13:30', 'checkIn'), attendance)).to.equal('onLeave');
        });
    });

    describe('getAttendanceStatus ( for a person with missed swipe)', function () {
        let checkOut = testData.timeLog.new('09:45', 'checkOut');
        let attendance = testData.attendance.new();
        // attendance.status = 'missSwipe';
        attendance.checkOut = checkOut.time;
        attendance.recentMostTimeLog = checkOut;
        attendance.timeLogs.push(checkOut);

        it('should return present for checkIn at 04:30', function () {
            expect(service._getAttendanceStatus(testData.timeLog.new('04:30', 'checkIn'), attendance)).to.equal('present');
        });
    });
});