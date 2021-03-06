"use strict";
let _ = require('lodash');
var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js');

let client = undefined;
let tlsTasks;

/**
 * Test cache so that we can make sure a refresh function is being called 
 * for our caches without having to alter their production refresh times
 */
let testCache = {
    name: 'testCache',
    lastUpdated: Date.now(),
    refreshTime: 1000,
    testRefresh: function(){
        return true;
    }
};



describe('Connecting to Asana', function(){

   //need to include some use of tlsAsana (getAllProjects in this case) 
   //to evaluate connection--if auth fails an error is thrown before the assert message
   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            client = response;
                
            return tlsAsana.getAllProjects().then( projectArray => {
                assert(Array.isArray( projectArray ), 'Connection authorized, but cannot get projects');
            });
        });
   });

});

describe('Making sure the available users update', function(){
    it('Should update the workspace users', function(){
        this.timeout(8000);
        return tlsAsana.updateUsers().then( response => {
            assert(response.data[0].name, "Chris Hodge", 'Failed to update the available users');
        });
    });
})

describe('Making sure caches update', function(){
    
    it('Should update the tag cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTagNames(10).then( response => assert.equal(response.Accepted,167304830178303,'Failed to update the tag cache') );
    });

    it('Should update the task cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(response => {
            tlsTasks = response;
            var testTask = _.filter(tlsTasks.data, ['created_at', "2016-08-26T20:13:13.727Z"]);
            assert.equal(testTask[0].id, 172981416524848, 'Failed to update task cache');
        });
    });
    
    it('Should get the tags associated with a task when the tasks are cached', function(){
        if(!tlsTasks){
            throw "Error, cannot check the tags associated with a task if the task cache did not update";
        } 
        var testTask = _.filter(tlsTasks.data, ['created_at', "2016-08-26T20:13:13.727Z"]);
        assert.equal(testTask[0].tags[1].name,"testing",'Failed to get tags associated with tasks');
    });

    it('Should update a local cache if it is older than its set refresh time', function(){
        this.timeout(8000);
        assert(tlsAsana.checkLastCacheUpdate(testCache, testCache.testRefresh), 'Failed to update local cache');
    });

});



describe('Querying our local caches', function(){
    
    it('Should get information about a specific task from the local tag cache', function(){
        return tlsAsana.getTaskInfoByID(169176168459508).then( taskInfo => assert.equal(taskInfo.created_at, '2016-08-17T21:06:24.132Z', 'getting specific task info failed') ); 
    });

    it('Should get a cached tag id from the local tag cache', function(){
        return tlsAsana.getTagIDByName('captioning_unassigned').then( tagID => assert.equal(tagID, 167304830178312, 'Failed to get cached tag id') );
    });
    
    it('Should get all of the local tasks that have a certain tag', function(){
        let tagID = 167304830178312;
        
        return tlsAsana.getTasksByTag(tagID).then(taskArray => {
            assert.notDeepEqual(_.filter(taskArray[0].tags, x => {
                return x.id === tagID;
            }), [], 'Failed to return a task with the correct tag');
        });
    });
    
    it('Should get all of the local tasks that have an unassigned tag', function(){     
        let unassignedTagID = 167304830178312;
        
        return tlsAsana.getUnassignedTasks().then(taskArray => {
            assert.notDeepEqual(_.filter(taskArray[0].tags, x => {
                return x.id === unassignedTagID;
            }), [], 'Failed to return a task with an unassigned tag');
        });
    });

    it('Should get all of the local tasks that have a new task tag', function(){
        let newTagID = 44184307053951;
        
        return tlsAsana.getNewTasks().then(taskArray => {
            assert.notDeepEqual(_.filter(taskArray[0].tags, x => {
                return x.id === newTagID;
            }), [], 'Failed to return a task with a new task tag');
        });
    });

});



describe('Querying Asana', function(){
    
    it('Should get all of the projects from Asana', function(){
        this.timeout(8000);

        return tlsAsana.getAllProjects().then( projects => assert.ok( projects.length > 0 ) ); 
    });
    
});


describe('Working with tags in Asana', function(){

    it("Should change a task's tag from captioning_unassigned to captioning_accepted", function(){
        this.timeout(8000);
        
        //Test looks at the tag in the first position of the tag array for this 
        //task,so the test may be broken if other tags are added to this task
        return tlsAsana.switchTag('166304358745259', 'captioning_unassigned', 'captioning_accepted').then(tag => {
            return client.tasks.findById('166304358745259').then( taskInfo => assert.strictEqual(taskInfo.tags[0].name, 'captioning_accepted', 'tag change failed') );
        });
    });

    it("Should change a task's tag from captioning_accepted to captioning_unassigned", function(){
        this.timeout(8000);
        
        //Test looks at the tag in the first position of the tag array for this 
        //task,so the test may be broken if other tags are added to this task
        return tlsAsana.switchTag('166304358745259', 'captioning_accepted', 'captioning_unassigned').then(tag => {
            return client.tasks.findById('166304358745259').then( taskInfo => assert.strictEqual(taskInfo.tags[0].name, 'captioning_unassigned', 'tag change failed') );
        });
    });

    //Test is ugly, but I was having trouble using the 'assert.throws' method with our promise structure.
    //This works as a thorough test even though it is messy
    it('Should look up an undefined tag and receive a tag error', function(){
        this.timeout(8000);
        
        return tlsAsana.getTagIDByName('blahblahblah').then( response => assert.ok(false, 'Undefined tag did not throw an error') )
        .catch(err => {
            if ( (err instanceof Error) && /Error, no tag exists in the cache with that name/.test(err) ) {
                assert.ok(true);
            }
            else {
                assert.ok(false, 'Undefined tag did not throw an error');
            }
        });
    });

});


// describe('Creating tasks in Asana', function(){
//     it('should create a new task', function(){
//         this.timeout(8000);
//         return tlsAsana.createTask(166216691534199, 'TestTask', "Test description here', '2/2/2016', {Teacher: 'Mr. Davis',Course: 'MAAT799'}).then( response => {
//             console.log(response);
//         });
//     });
// });
