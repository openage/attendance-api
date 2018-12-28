'use strict';
let expect = require('chai').expect;
let sinon = require('sinon');
let communications = require('../../services/communications');
let db = require('../../models');
require('sinon-mongoose');
let testData = require('../testData');


describe('attendance-check-in-late-notify-supervisor processor', function () {
    let processor = require('../../actionHandlers/attendance/check-in/coming-late-notify-supervisor');

    beforeEach(function () {
        sinon.stub(communications, 'send');
    });

    afterEach(function () {
        communications.send.restore();
    });

    it('should have process function', function () {
        expect(typeof processor.process).to.equal('function');
    });

    it('should notify', function () {
        let attendanceMock = sinon.mock(db.attendance);

        attendanceMock
            .expects('findById')
            .chain('populate')
            .resolves(testData.attendance.new());

        attendanceMock
            .expects('find')
            .chain('populate')
            .resolves(testData.attendance.list('check-in-late'));

        return processor.process({
            id: "597f2d319f2c5e1cd33ffc7e"
        }, {
            trigger: {
                noOfTime: 2,
                inARow: false,
                noOfMin: 30
            },
            processor: {
                level: 1,
                channel: 'chat'
            }
        }, testData.context).then(() => {
            sinon.assert.calledOnce(communications.send);
            attendanceMock.restore();
        });
    });

    it('should not notify', function () {
        let attendanceMock = sinon.mock(db.attendance);

        attendanceMock
            .expects('findById')
            .chain('populate')
            .resolves(testData.attendance.new());

        attendanceMock
            .expects('find')
            .chain('populate')
            .resolves(testData.attendance.list('on-time'));

        return processor.process({
            id: "597f2d319f2c5e1cd33ffc7e"
        }, {
            trigger: {
                noOfTime: 2,
                inARow: false,
                noOfMin: 30
            },
            processor: {
                level: 1,
                channel: 'chat'
            }
        }, testData.context).then(() => {
            sinon.assert.notCalled(communications.send);
            attendanceMock.restore();
        });
    });
});