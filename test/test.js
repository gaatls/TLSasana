"use strict";
var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js');
let client = undefined;

describe('Connecting to Asana', function(){
   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            client = response;
            assert(response,'Connection failed');
        });
   });
});

describe('Making sure caches update', function(){
    it('Should update the tag cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTagNames(10).then(function(response){
            assert.equal(response.Accepted,167304830178303,'Tag cache updated successfully');
        })
    });

    let tlsTasks;

    it('Should update the task cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(function(response){
            assert.equal(response.data[0].id, 173632881940301, 'Task cache updated successfully');
            tlsTasks = response;
        })
    });
    
    it('Should get the tags associated with a task when the tasks are cached', function(){
        if(!tlsTasks) throw "Error, can't get associated tags if task cache did not update";
        assert.equal(tlsTasks.data[0].tags[0].name,"Captioning",'Successfully got tags associated with tasks');
    })

    it('Should update a local cache if it is older than its set refresh time', function(){
        this.timeout(20000);
        setTimeout(function(){
            console.log(tlsAsana.checkTaskCache());
            assert(tlsAsana.checkTaskCache(), "Test task cache did not update");
        }, 11000);
        
        
    })
});


describe('Querying our local caches', function(){
    it('Should get information about a specific task from the local tag cache', function(){
        tlsAsana.getTaskInfoByID(173632881940301).then(taskInfo => {
            assert(taskInfo.created_at, '2016-08-29T18:21:24.044Z', 'getting specific task info failed'); 
        })
    });

    it('Should get a cached tag id from the local tag cache', function(){
        this.timeout(8000);

        return tlsAsana.getTagIDByName('captioning_unassigned').then(function(response){
            assert.deepEqual(response, 167304830178312, 'local tag cache id request failed');
        });
    });
    
    it('Should get all of the local tasks that have a certain tag', function(){
        assert.ok(tlsAsana.getTasksByTag(43742631645357).length > 0);
    });
    
    it('Should get all of the local tasks that have an unnassigned tag', function(){
        assert.ok(tlsAsana.getUnassignedTasks().length > 0);
    });

});

describe('Querying Asana', function(){
    
    // it('gets all of the new tasks in Asana', function(){
    //     this.timeout(8000);
    //     return tlsAsana.getNewRequests().then(function(list){
    //         assert.ok(list.length > 0); 
    //     });
    // });
    
    it('Should get all of the projects from Asana', function(){
        this.timeout(8000);
        return tlsAsana.getAllProjects().then(function(projects){
            assert.ok( projects.length > 0 ); 
        });
    });
    
});

//describe('Working with sections in Asana', function(){
//
//        it('gets all of the sections within the test project', function(){
//            this.timeout(8000);
//            return tlsAsana.getAllSections(tlsConsts.PROJ_NTP).then(function(sections){
//                assert.ok( sections.length > 0);
//            });
//});
//    it('sets the section to unassigned', function(){
//        this.timeout(8000);
//        return tlsAsana.moveTaskToSection('166304358745259', tlsConsts.SECTION_UNASSIGNED, tlsConsts.PROJ_NTP).then(function(returnedTask){
//            assert(returnedTask);
//        });
//    });
//    
//    it('sets the section to accepted', function(){
//        this.timeout(8000);
//        return tlsAsana.moveTaskToSection('166304358745259', tlsConsts.SECTION_ACCEPTED, tlsConsts.PROJ_NTP).then(function(returnedTask){
//            assert(returnedTask);
//        });
//    });
//});
//
//describe('Working with tasks in Asana', function(){
//    it('gets the information about a specific task', function(){
//        return tlsAsana.getTaskInfo('166304358745259').then(function(returnedTask){
//            assert.ok(returnedTask); 
//        });
//    });
//});

describe('Working with tags in Asana', function(){

    // it('changes a tag from captioning_unassigned to captioning_accepted', function(){
    //     this.timeout(8000);
    //
    //     return tlsAsana.switchTag('166304358745259', 'captioning_unassigned', 'captioning_unassigned').then(tag => {
    //         assert.deepEqual(tag, {}, 'tag change failed');
    //     });
    // });

    // it('changes a tag back from captioning_accepted to captioning_unassigned ', function(){
    //     this.timeout(8000);
    //
    //     return tlsAsana.switchTag('166304358745259', 'captioning_unassigned', 'captioning_unassigned').then(tag => {
    //         assert.deepEqual(tag, {}, 'tag change failed');
    //     });
    // });

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

    //TODO, change tests below to look like test above (need to use asynce promise notation now for getTagID func);

    // it('looks up an undefined tag and receives undefined back', function(){
    //     this.timeout(8000);
    //     assert.deepStrictEqual(tlsAsana.getTagIDByName('blahblahblahblah'), undefined, 'It should return undefined but it returns something else');
    // });
});
