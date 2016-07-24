var asana = require('./index.js');

asana.connect();

asana.getTasks().then(function(data){
    console.log( data.length + " tasks received!")
});

asana.getUnassigned().then(function(data){
    console.log("unassigned count: " + data.length);
    //console.log(data);
});

asana.getNewRequests().then(function(data){
    console.log("New Task Count: " + data.length);
    
});