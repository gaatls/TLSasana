"use strict";
var asana = require('asana');
var tlsVars = require('./tlsConstants.js')
var asanaKey = process.env.ASANAKEY;
let client = null;

module.exports = {
    /**
     * Always needs to be run first to startup the connection between node and asana.
     * Everything else uses this connection to run.
     **/
    connect: function () {
        try {
            client = asana.Client.create().useAccessToken(asanaKey);
        }
        catch (err) {
            console.log(err);
        }
        return client;
    }
    , /**
     * Gets a list of all of the tasks in the asana instance
     **/
    getTasks: function () {
        return new Promise(function (resolve, reject) {
            client.projects.tasks(tlsVars.TAG_CAPTIONING).then(function (list) {
                resolve(list.data);
            });
        });
    }
    , /**
     * Returns all of the tasks that unassigned
     **/
    getUnassigned: function () {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tlsVars.TAG_UNASSIGNED).then(function (list) {
                resolve(list.data);
            });
        });
    }
    , /**
     * Returns all of the new requests
     **/
    getNewRequests: function () {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tlsVars.TAG_NEWTASK).then(function (list) {
                resolve(list.data);
            });
        });
    }
    , /**
     * Returns information about a specific task
     *
     * @param taskID - the id in asana of the task we are interested in
     * @return {Promise} A promise containing information about a specific task in Asana
     **/
    getTaskInfo: function (taskID) {
        return new Promise(function (resolve, reject) {
            client.tasks.findById(taskID).then(function(task){
                resolve(task);
            });
        });
    },
    
    /**
    * Returns a list of all of the projects currently in Asana
    *
    * @return {Promise} A promise containing a list of all of the projects
    */
    getAllProjects: function(){
        return new Promise( function(resolve, reject){
            client.projects.findAll({team:tlsVars.TEAM_TLSMEDIA}).then( function(projectList){
                resolve(projectList.data);
            });
        });
    }
    
    
}
