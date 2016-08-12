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
    getTasksByTag: function (tag) {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tag).then(function (list) {
                resolve(list.data);
            });
        });
    }
    , /**
     * Returns all of the tasks that unassigned
     **/
    getUnassigned: function () {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tlsVars.TAG_CAPTIONING_UNASSIGNED).then(function (list) {
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
    , 
    
    /**
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
    },
    
    /**
    * Returns a list of all of the sections currently within a project
    *
    * @param projectID The projectID in which the sections reside
    * @return {Promise} A promise containing the list of all of the sections within a project
    */
    
    getAllSections: function(projectID){
        return new Promise( function(resolve,reject){
            client.projects.sections(projectID).then( function(sectionList){
                resolve(sectionList.data); 
            });
        }); 
    },
    
    /**
    * Moves a specific task to a specific section
    * 
    * @param taskID The task to be moved
    * @param newSection The section ID to move the task to
    * @param projectID The project ID the task resides in
    */
    
    moveTaskToSection: function(taskID, newSection, projectID){
        return new Promise( function(resolve,reject){
            client.tasks.addProject(taskID, {project: projectID, section:newSection}).then(function(taskBack){
                resolve(taskBack);
            });
        });
    },
    
    
    /**
    * switches from the current tag to a new tag
    * 
    * @param taskID the id of the task that you'd like to switch
    * @param oldTag the tagID from tlsConstants that you'd like to switch from
    * @param newTag the tagID from tlsConstants that you'd like to switch to
    * @return {promise} A promise containing the task information after change
    */
    
    switchTag: function(taskID, oldTag, newTag){
        return new Promise( function(resolve, reject){
            client.tasks.addTag(taskID, {tag:newTag}).then( function(taskBack){
                client.tasks.removeTag(taskID, {tag:oldTag}).then(function(taskAfter){
                    resolve(taskAfter);  
                });
            });
        });
    }
}
