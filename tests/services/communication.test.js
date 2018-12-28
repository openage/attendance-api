'use strict';
let expect = require('chai').expect;
let sinon = require('sinon');
let db = require('../../models');
require('sinon-mongoose');
let testData = require('../testData');

let slack = require('../../providers/slack');



describe('communication service', function () {
    let service = require('../../services/communications');

    before(function () {
        sinon.stub(slack, 'chat');
    });

    after(function () {
        slack.chat.restore();
    });

    it('should have send function', function () {
        expect(typeof service.send).to.equal('function');
    });

    it('should send chat message', function () {

        let orgMock = sinon.mock(db.organization);
        let employeeMock = sinon.mock(db.employee);
        let notificationMock = sinon.mock(db.notification.prototype);

        let org = testData.organization.new();
        let employee = testData.employee.new();

        orgMock.expects('findById')
            .chain('populate')
            .resolves(org);

        orgMock.expects('findById')
            .chain('populate')
            .chain('populate')
            .chain('populate')
            .resolves(org);


        notificationMock.expects('save').resolves({
            data: {},
            message: "dummy text",
            status: "inactive",
            subject: "dummy text"
        });

        employeeMock.expects('findOneAndUpdate').resolves(employee);

        return service.send({
                employee: employee,
                level: 1
            }, {
                entity: {
                    id: '000',
                    type: 'dummy',
                    picData: '',
                    picUrl: ''
                },
                data: {
                    unitBool: true,
                    unitString: 'test-string'
                },
                template: 'test-template',
            }, ['chat'], testData.context)
            .then(() => {
                sinon.assert.calledOnce(slack.chat);
                orgMock.restore();
                employeeMock.restore();
                notificationMock.restore();
            });
    });

    // it('should send push', function() {
    //     expect(false).to.be(true);
    // });

    // it('should send sms', function() {
    //     expect(false).to.be(true);
    // });

    // it('should send email', function() {
    //     expect(false).to.be(true);
    // });
});