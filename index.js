"use strict";
var asana = require('asana');
var asanaKey = process.env.ASANAKEY;
let client = null;

const UNASSIGNED = '44184307053957';
const CAPTIONING = '79193009274138';
module.exports ={
    
    /**
    * Always needs to be run first to startup the connection between node and asana.
    * Everything else uses this connection to run.
    **/
    connect: function(){
        try{
            client = asana.Client.create().useAccessToken(asanaKey);
        }
        catch(err){
            console.log(err);
        }
        return client;
    },
    
    /**
    * Gets a list of all of the tasks in the asana instance
    **/
    getTasks: function(){
        return new Promise(
            function(resolve, reject){
                client.projects.tasks(CAPTIONING).then(function(list){
                    resolve(list.data);
                });
            });
    },
    
    getUnassigned: function(){
        return new Promise(
            function(resolve, reject){
                client.tasks.findByTag(UNASSIGNED).then(function(list){
                    resolve(list.data);
                });
            });
    }
    
}