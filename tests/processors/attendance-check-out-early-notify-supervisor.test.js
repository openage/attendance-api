'use strict';
var expect = require('chai').expect;
let sinon = require('sinon');
let communications = require('../../services/communications');
let db = require('../../models');
require('sinon-mongoose');
let testData = require('../testData');

describe('attendance-check-out-early-notify-supervisor processor', function () {
    let processor = require('../../actionHandlers/attendance/check-out/going-early-notify-supervisor');
    let data = {
        id: "597f2d319f2c5e1cd33ffc7e"
    };

    let config = {
        trigger: {
            noOfTime: 2,
            inARow: 'no',
            earlyByMinutes: 30
        },
        processor: {
            level: 1,
            channel: 'chat-bot'
        }
    };

    let context = {
        organization: {
            id: ""
        }
    };


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

        // set data that mogoose will serve
        attendanceMock
            .expects('findById').withArgs('597f2d319f2c5e1cd33ffc7e')
            .chain('populate')
            .resolves(testData.attendance.obj('597f2d319f2c5e1cd33ffc7e'));

        attendanceMock
            .expects('find')
            .chain('populate')
            .resolves(testData.attendance.list('check-out-early'));

        return processor.process(data, config, context).then(() => {
            sinon.assert.calledOnce(communications.send);

            // restore mongose
            attendanceMock.restore();
        });
    });

    it('should not notify', function () {
        let attendanceMock = sinon.mock(db.attendance);

        attendanceMock
            .expects('findById').withArgs('597f2d319f2c5e1cd33ffc7e')
            .chain('populate')
            .resolves(testData.attendance.obj('597f2d319f2c5e1cd33ffc7e'));

        attendanceMock
            .expects('find')
            .chain('populate')
            .resolves(testData.attendance.list('on-time'));

        return processor.process(data, config, context).then(() => {
            sinon.assert.notCalled(communications.send);
            attendanceMock.restore();
        });
    });
});