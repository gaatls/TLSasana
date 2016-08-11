var assert = require('assert');
var tlsAsana = require('../index.js');
var tlsConsts = require('../tlsConstants.js')

describe('Connecting to Asana', function(){
   it('Should return "connected"', function(){
        return tlsAsana.connect(); 
   });
});

describe('Querying Asana', function(){
    it('gets all of the tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getTasks().then(function(list){
            assert.ok(list.length > 0);
        });
    });
    
    it('gets all of the unassigned tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getUnassigned().then(function(list){
            assert.ok(list.length > 0);
        });
    });
    
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
    
    it('gets all of the sections within the test project', function(){
        this.timeout(8000);
        return tlsAsana.getAllSections(tlsConsts.PROJ_NTP).then(function(sections){
            assert.ok( sections.length > 0);
            console.log(sections);
        });
    });
});
