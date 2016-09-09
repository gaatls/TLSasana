/**This is a development only file that I was using to clean up the test file and make the 
 * main test file more organized
 */


"use strict";
var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js')

//// CONNECTION -----------------------------------
describe('Connecting to Asana', function(){
   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            assert.deepEqual(response,true,'Successful connection');
        });
   });
});
//// CONNECTION -----------------------------------


describe('Working with tags in Asana', function(){

    it('changes a tag from captioning_unassigned to captioning_accepted', function(){
        this.timeout(8000);
        let promiseArray = [
            tlsAsana.getTagIDByName('captioning_unassigned'),
            tlsAsana.getTagIDByName('captioning_accepted')
        ];

        return Promise.all(promiseArray).then(responses => {
            return tlsAsana.switchTag('166304358745259', responses[0], responses[1]).then(tag => {
                assert.deepEqual(tag, {}, 'tag change failed');
            });
        });
    });

    // it('changes a tag back from captioning_accepted to captioning_unassigned ', function(){
    //     this.timeout(8000);
    //     let promiseArray = [
    //         tlsAsana.getTagIDByName('captioning_accepted'),
    //         tlsAsana.getTagIDByName('captioning_unassigned')
    //     ];

    //     return Promise.all(promiseArray).then(responses => {
    //         return tlsAsana.switchTag('166304358745259', responses[0], responses[1]).then(function(tag){
    //             assert(tag, 'tag change failed');
    //         });
    //     });
    // });

});

