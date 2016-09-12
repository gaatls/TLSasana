"use strict";
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

   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            client = response;
            assert(response,'Connection failed');
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
        return tlsAsana.updateTagNames(10).then(function(response){
            assert.equal(response.Accepted,167304830178303,'Failed to update the tag cache');
        })
    });

    it('Should update the task cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(function(response){
            tlsTasks = response;
            assert.equal(response.data[0].id, 180230098413779, 'Failed to update task cache');
        })
    });
    
    it('Should get the tags associated with a task when the tasks are cached', function(){
        if(!tlsTasks){
            throw "Error, cannot check the tags associated with a task if the task cache did not update";
        } 
        assert.equal(tlsTasks.data[4].tags[0].name,"New Request",'Failed to get tags associated with tasks');
    });

    it('Should update a local cache if it is older than its set refresh time', function(){
        this.timeout(8000);

        assert(tlsAsana.checkLastCacheUpdate(testCache, testCache.testRefresh), 'Failed to update local cache');
    });

});



describe('Querying our local caches', function(){
    
    it('Should get information about a specific task from the local tag cache', function(){
        return tlsAsana.getTaskInfoByID(169176168459508).then(taskInfo => {
            assert.equal(taskInfo.created_at, '2016-08-17T21:06:24.132Z', 'getting specific task info failed'); 
        })
    });

    it('Should get a cached tag id from the local tag cache', function(){
        return tlsAsana.getTagIDByName('captioning_unassigned').then(tagID => {
            assert.equal(tagID, 167304830178312, 'Failed to get cached tag id');
        });
    });
    
    it('Should get all of the local tasks that have a certain tag', function(){
        return tlsAsana.getTasksByTag(167304830178312).then(taskArray => {
            assert(taskArray.length > 0, 'Failed to get local tasks with a certain tag');
        })   
    });
    
    it('Should get all of the local tasks that have an unassigned tag', function(){
        return tlsAsana.getUnassignedTasks().then(taskArray => {
            assert(taskArray.length > 0, 'Failed to get local tasks with the unassigned tag');
        });
    });

    it('Should get all of the local tasks that have a new task tag', function(){
        return tlsAsana.getNewTasks().then(taskArray => {
            assert(taskArray.length > 0, 'Failed to get local tasks with the new task tag');
        });
    });

});



describe('Querying Asana', function(){
    
    it('Should get all of the projects from Asana', function(){
        this.timeout(8000);

        return tlsAsana.getAllProjects().then(projects => { 
            assert.ok( projects.length > 0 ); 
        });
    });
    
});


describe('Working with tags in Asana', function(){

    it("Should change a task's tag from captioning_unassigned to captioning_accepted", function(){
        this.timeout(8000);
        
        return tlsAsana.switchTag('166304358745259', 'captioning_unassigned', 'captioning_accepted').then(tag => {
                return client.tasks.findById('166304358745259').then(taskInfo => {  
                    //Test looks at the tag in the first position of the tag array for this 
                    //task,so the test may be broken if other tags are added to this task
                    
                    // console.log('Task tag switched to:');
                    // console.log(taskInfo.tags[0]);
                    assert.strictEqual(taskInfo.tags[0].name, 'captioning_accepted', 'tag change failed');
                });
        });
    });

    it("Should change a task's tag from captioning_accepted to captioning_unassigned", function(){
        this.timeout(8000);
        
        return tlsAsana.switchTag('166304358745259', 'captioning_accepted', 'captioning_unassigned').then(tag => {
                return client.tasks.findById('166304358745259').then(taskInfo => {  
                    //Test looks at the tag in the first position of the tag array for this 
                    //task,so the test may be broken if other tags are added to this task
                    
                    // console.log('Task tag switched to:');
                    // console.log(taskInfo.tags[0]);
                    assert.strictEqual(taskInfo.tags[0].name, 'captioning_unassigned', 'tag change failed');
                });
        });
    });

    //Test is ugly, but I was having trouble using the 'assert.throws' method with our promise structure.
    //This works as a thorough test even though it is messy
    it('Should look up an undefined tag and receive a tag error', function(){
        this.timeout(8000);
        
        return tlsAsana.getTagIDByName('blahblahblah').then( response => {
            assert.ok(false, 'Undefined tag did not throw an error');
        }).catch(err => {
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
