/**This is a development only file that I am using to make initial tests and 
 * clean up existing test without running the whole test file everytime
 *
 * ONLY COMMITTING BECAUSE I SWITCH COMPUTERS A LOT...otherwise I would ignore this file
 */


"use strict";
var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js')
let client = undefined;

//// CONNECTION -----------------------------------
describe('Connecting to Asana', function(){
   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            client = response;
            assert(response,'Connection failed');
        });
   });
});
//// CONNECTION -----------------------------------


describe('create task stuff', function(){
    it('Should use promise for task creation', function(){
        this.timeout(8000);
        // return tlsAsana.autoCacheCheck(1000).then(response => {
        //     console.log(response);
        //     assert(response, 'error');
        // })
        return tlsAsana.createTask().then( response => {
            console.log(response);
            assert(response,'Connection failed');
        });
    });

});


