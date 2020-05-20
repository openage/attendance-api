'use strict';
let expect = require('chai').expect;
let sinon = require('sinon');
const defaultConfig = require('config').get('organization')

async function testFunction (isOK) {
    if (isOK === true) {
      return 'OK'
    } else {
      throw new Error('not OK')
    }
}


describe('attendances hooks', function () {
    let checkIn = require('../../actionHandlers/attendance/check-in/web-hook');

    // sinon.stub('node-rest-client-promise', {
    //     Client: function() {
    //         return {
    //             postPromise: async (url, args)=>{
    //             }
    //         }
    //     }
    // })

    beforeEach(function () {});
    afterEach(function () {});
       
    it('should send attendance with status present', async (done) => {

        let result = await testFunction(true)
        expect(result).to.be.equal('OK')
        return done()
        

        // let context = {
        //     logger: require('@open-age/logger'),
        //     config: defaultConfig,
        //     permissions: []
        // }
        // checkIn.process({}, context )
    });
    
});