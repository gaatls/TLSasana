var assert = require('assert');
var tlsAsana = require('../index.js');

describe('Connecting to Asana', function(){
   it('Should return "connected"', function(){
        return tlsAsana.connect(); 
   });
});

describe('Querying Asana', function(){
    it('Gets all of the tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getTasks().then(function(list){
            assert.ok(list.length > 0);
        });
    });
    
    it('Gets all of the unassigned tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getUnassigned().then(function(list){
            assert.ok(list.length > 0);
        });
    });
    
    it('Gets all of the new tasks in Asana', function(){
        this.timeout(8000);
        return tlsAsana.getNewRequests().then(function(list){
            assert.ok(list.length > 0); 
        });
    });
});
