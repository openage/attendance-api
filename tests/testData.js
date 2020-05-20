'use strict';
var jsonfile = require('jsonfile');
var appRoot = require('app-root-path');

var paramCase = require('param-case');
// var fs = require('fs');
const getFromFile = (model, type, name) => {

    return jsonfile.readFileSync(`${appRoot}/tests/data/${paramCase(model)}/${type}-${paramCase(name)}.json`, {
        reviver: (key, value) => {
            if (typeof value === 'string' && value.indexOf('T') && value.endsWith('Z')) {
                return new Date(value);
            }
            return value;
        }
    });
};

const organization = {
    list: (name) => {
        return getFromFile('organization', 'list', name);
    },
    obj: (name) => {
        return getFromFile('organization', 'obj', name);
    },
    new: () => {
        return {
            _id: "597f2d319f2c5e1cd33ffc7e",
            name: "Test Organization",
            code: "test",
            "externalUrl": "http://ems.mindfulsas.com/api/employees/${id}",
            "activationKey": "84123dc0-5370-11e7-a6e1-1df24bdfb8bc",
            "devicesVersion": "6",
            "devices": [],
            "channels": [],
            "communicationApps": {
                "chat": {
                    "config": {
                        "webhookUrl": "mdgsdg.slack.com"
                    },
                    "type": {
                        "category": "chat",
                        "name": "slack",
                        "providerName": "slack",
                        "picUrl": "http://res.cloudinary.com/dkws91cqo/image/upload/v1503475390/slack_bayd8k.png",
                        "description": "Use Slack to notify supervisor of employee",
                        "parameters": [{
                            "name": "webhookUrl",
                            "title": "Webhook Url",
                            "type": "string",
                            "description": "Webhook Url to Connect with Slack",
                            "expectedValues": []
                        }]
                    },
                    "status": "active"
                }
            }
        };
    }
};

const shiftType = {
    list: (name) => {
        if (name) {
            return getFromFile('shiftType', 'list', name);
        }
    },
    obj: (name) => {
        return getFromFile('shiftType', 'obj', name);
    },
    new: () => {
        return {
            _id: "597f2d319f2c5e1cd33ffc7e",
            code: "gen",
            name: "General",
            startTime: new Date("2017-07-01T03:30:00.000Z"),
            endTime: new Date("2017-07-01T12:30:00.000Z"),
            monday: "full",
            tuesday: "full",
            wednesday: "full",
            thursday: "full",
            friday: "full",
            saturday: "off",
            sunday: "off"
        };
    }
};

const employee = {
    list: (name) => {
        return getFromFile('employee', 'list', name);
    },
    obj: (name) => {
        return getFromFile('employee', 'obj', name);
    },
    new: () => {
        return {
            _id: "597f2d319f2c5e1cd33ffc7e",
            id: "597f2d319f2c5e1cd33ffc7e",
            name: "Test Employee",
            code: "10001",
            phone: "0000000000",
            email: "test-employee@aqua.com",
            shiftType: shiftType.new()
        };
    }
};

const attendance = {
    list: (name) => {
        if (name) {
            return getFromFile('attendance', 'list', name);
        }
    },
    obj: (name) => {
        return getFromFile('attendance', 'obj', name);
    },
    new: () => {
        return {
            _id: "597f2d319f2c5e1cd33ffc7e",
            status: 'absent',
            checkIn: null,
            checkOut: null,
            hoursWorked: 0,
            ofDate: new Date("2017-07-18T03:30:00.000Z"),
            shift: {
                date: new Date("2017-07-18T03:30:00.000Z"),
                status: "working",
                shiftType: shiftType.new()
            },
            recentMostTimeLog: null,
            timeLogs: [],
            employee: employee.new()
        };
    }
};

const timeLog = {
    list: (name) => {
        return getFromFile('timeLog', 'list', name);
    },
    obj: (name) => {
        return getFromFile('timeLog', 'obj', name);
    },
    new: (HHmm, type) => {
        return {
            _id: "597f2d319f2c5e1cd33ffc7e",
            time: new Date(`2017-07-18T${HHmm}:00.000Z`),
            employee: employee.new(),
            type: type
        };
    }
};

const time = {
    new: (HHmm) => {
        return new Date(`2017-07-18T${time}:00.000Z`);
    }
};


exports.attendance = attendance;
exports.time = time;
exports.timeLog = timeLog;
exports.employee = employee;
exports.shiftType = shiftType;
exports.organization = organization;

exports.context = {
    organization: organization.new()
};
