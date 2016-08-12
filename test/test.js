var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js')

describe('Connecting to Asana', function(){
   it('Should return "connected"', function(){
        return tlsAsana.connect(); 
   });
});

describe('Querying Asana', function(){
    
    it('gets all of the new tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getNewRequests().then(function(list){
            assert.ok(list.length > 0); 
        });
    });
    
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
        return tlsAsana.getTasksByTag(tlsConsts.TAG_CAPTIONING_UNASSIGNED).then(function(list){
            assert.ok(list.length > 0); 
        });
    });
    
    it('gets all of the unassigned captioning tags in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getUnassigned().then(function(list){
            assert.ok(list.length > 0);
        });
    });
    
    it('changes a tag from captioning_unassigned to captioning_accepted', function(){
        this.timeout(8000);
        return tlsAsana.switchTag('166304358745259', '167304830178312', '167304830178315').then(function(tag){
            assert.ok(tag);
        });
    });
    
    it('changes a tag back from captioning_accepted to captioning_unassigned', function(){
        this.timeout(8000);
        return tlsAsana.switchTag('166304358745259', '167304830178315', '167304830178312').then(function(tag){
            assert.ok(tag);
        });
    });
});
