var assert = require('assert');
var tlsAsana = require('../index.js');

describe('Connecting to Asana', function(){
   it('Should return "connected"', function(){
        assert.deepEqual(tlsAsana.connect(), "Connected!" ); 
   });
});
