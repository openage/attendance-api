'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
require('sinon-mongoose');

let testData = require('../testData');
let db = require('../../models');

describe('attendances service - getTimeLogStatus function', function () {
    let service = require('../../services/attendances');

    beforeEach(function () {});

    afterEach(function () {});

    describe('for 03:30 to 12:30 shift', function () {

        let attendance = testData.attendance.new();

        it('should return checkIn at 02:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('02:30'), attendance)).to.equal('checkIn');
        });
        it('should return checkIn at 04:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('04:30'), attendance)).to.equal('checkIn');
        });

        it('should return checkIn at 07:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('07:30'), attendance)).to.equal('checkIn');
        });

        it('should return checkOut at 09:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('09:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkOut at 11:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('11:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkOut at 13:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('13:30'), attendance)).to.equal('checkOut');
        });
    });

    describe('for attendance checked In at 03:15', function () {
        let checkIn = testData.timeLog.new('03:15', 'checkIn');
        let attendance = testData.attendance.new();
        attendance.status = 'checkedIn';
        attendance.checkIn = checkIn.time;
        attendance.recentMostTimeLog = checkIn;
        attendance.timeLogs.push(checkIn);

        it('should return checkIn at 02:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('02:30'), attendance)).to.equal('checkIn');
        });
        it('should return checkOut at 04:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('04:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkIn at 07:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('07:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkOut at 09:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('09:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkOut at 11:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('11:30'), attendance)).to.equal('checkOut');
        });

        it('should return checkOut at 13:30', function () {
            expect(service._getTimeLogStatus(testData.timeLog.new('13:30'), attendance)).to.equal('checkOut');
        });
    });
});