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

describe('Working with caches', function(){
    it('Should update the tag cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTagNames(10).then(function(response){
            assert.equal(response.Accepted,167304830178303,'Tag cache updated successfully');
        })
    });

    it('Should update the task cache', function(){
        this.timeout(8000);
        return tlsAsana.updateTasks().then(function(response){
            assert.equal(response.data[0].id, 173632881940301, 'Task cache updated successfully');
        })
    });

    it('requests a cached id from the local tag cache', function(){
        this.timeout(8000);

        return tlsAsana.getTagIDByName('captioning_unassigned').then(function(response){
            console.log(response);
            assert.deepEqual(response, 167304830178312, 'local tag cache id request failed');
        });
    });


});

