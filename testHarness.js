var asana = require('./index.js');

asana.connect();

asana.getTasks().then(function(data){
    console.log( data.length + " tasks received!")
});

asana.getUnassigned().then(function(data){
    console.log("unassigned count: " + data.length);
    //console.log(data);
});

try{
    asana.getNewRequests().then(function(data){
        console.log("==================================================");
        console.log("New Task Count: " + data.length);
    });
}catch(err){
    console.log("error: " + err)
}

try{
    asana.getTaskInfo('158749385851178').then(function(info){
        console.log("===================TASK INFO=======================");
        console.log(info);
        console.log("===================================================");
    });
}catch(err){
    console.log("error: " + err)
}


try{
    asana.getAllProjects().then(function(projects){
        console.log("==============ALL PROJECTS=========================");
        console.log(projects);
        console.log("===================================================");
    });
}catch(err){
    console.log("error: " + err)
}