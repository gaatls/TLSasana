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
            //console.log(client);
            assert(response,'Connection failed');
        });
   });
});
//// CONNECTION -----------------------------------


describe('Working with tags in Asana', function(){

    it('changes a tag from captioning_unassigned to captioning_accepted', function(){
        this.timeout(8000);
        
        return tlsAsana.switchTag('166304358745259', 'captioning_unassigned', 'captioning_accepted').then(tag => {
                return client.tasks.findById('166304358745259').then(taskInfo => {  
                    //Test looks at the tag in the first position of the tag array for this 
                    //task,so the test may be broken if other tags are added to this task
                    console.log('Task tag switched to:');
                    console.log(taskInfo.tags[0]);
                    assert.strictEqual(taskInfo.tags[0].name, 'captioning_accepted', 'tag change failed');
                });
        });
    });

    it('changes a tag from captioning_accepted to captioning_unassigned', function(){
        this.timeout(8000);
        
        return tlsAsana.switchTag('166304358745259', 'captioning_accepted', 'captioning_unassigned').then(tag => {
                return client.tasks.findById('166304358745259').then(taskInfo => {  
                    //Test looks at the tag in the first position of the tag array for this 
                    //task,so the test may be broken if other tags are added to this task
                    console.log('Task tag switched to:');
                    console.log(taskInfo.tags[0]);
                    assert.strictEqual(taskInfo.tags[0].name, 'captioning_unassigned', 'tag change failed');
                });
        });
    });

});

