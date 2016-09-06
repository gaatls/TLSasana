"use strict";
var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js')

describe('Connecting to Asana', function(){
   it('Should setup the connection', function(){
        this.timeout(8000);
        return tlsAsana.connect('166216691534199').then(function(response){
            assert.deepEqual(response,true,'Successful connection');
        });
   });
});

describe('Updating the caches', function(){
    it('Should update the tag cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTagNames(10).then(function(response){
            assert.equal(response.Accepted,167304830178303,'Tag cache updated successfully');
        })
    });

    it('Should update the task cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(function(response){
            assert.equal(response.data[0].id,173632881940301,'Task cache updated successfully');
        })
    });

    let tlsTasks;
    
    it('Should get tags associated with a task when the tasks are cached', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(function(response){
            assert.equal(response.data[0].tags[0].name,"Captioning",'Successfully got tags associated with tasks');
            
            tlsTasks = response;
        })
    })

    it('Should update the local task cache if older than set refresh time', function(){
        assert(tlsAsana.checkLastCacheUpdate(tlsTasks, tlsAsana.updateTasks, 0), "Task cache was updated");
    })


});

describe('Querying Asana', function(){
    
    // it('gets all of the new tasks in Asana', function(){
    //     this.timeout(8000);
    //     return tlsAsana.getNewRequests().then(function(list){
    //         assert.ok(list.length > 0); 
    //     });
    // });
    
    it('gets information about a specific task from asana', function(){
        this.timeout(8000);
        return tlsAsana.getTaskInfo('158749385851178').then(function(data){
            assert.deepEqual(data.created_at, '2016-07-22T19:14:05.354Z' ); 
        });
    });
    
    it('gets all of the projects from Asana', function(){
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
    it('gets all of the unassigned tags', function(){
        this.timeout(8000);
        // return tlsAsana.getTasksByTag(167304830178312).then(function(list){
        //     assert.ok(list.length > 0); 
        // });
        assert.ok(tlsAsana.getTasksByTag(167304830178312).length > 0);
    });
    
    it('gets all of the unassigned captioning tags in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getUnassigned().then(function(list){
            assert.ok(list.length > 0);
        });
    });

    it('requests a cached tag from the tlsAsana library', function(){
        console.log("      Cached: " + tlsAsana.getCachedTagID('captioning_unassigned'));
        return assert.deepEqual(tlsAsana.getCachedTagID('captioning_unassigned'), '167304830178312', 'it worked');
    });
    
    it('changes a tag from captioning_unassigned to captioning_accepted', function(){
        this.timeout(8000);
        return tlsAsana.switchTag('166304358745259', tlsAsana.getCachedTagID('captioning_unassigned'), tlsAsana.getCachedTagID('captioning_accepted')).then(function(tag){
            assert.ok(tag);
        });
    });
    
    it('changes a tag back from captioning_accepted to captioning_unassigned', function(){
        this.timeout(8000);
        return tlsAsana.switchTag('166304358745259', tlsAsana.getCachedTagID('captioning_accepted'), tlsAsana.getCachedTagID('captioning_unassigned')).then(function(tag){
            assert.ok(tag);
        });
    });

    it('looks up an undefined tag and receives undefined back', function(){
        this.timeout(8000);
        assert.deepStrictEqual(tlsAsana.getCachedTagID('blahblahblahblah'), undefined, 'It should return undefined but it returns something else');
    });
});
