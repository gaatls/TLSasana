var asana = require('./index.js');

asana.connect();

asana.getTasks().then(function(data){
    console.log( data.length + "tasks received!")
});

asana.getUnassigned().then(function(data){
    console.log(data);
});