"use strict";
var asana = require('asana');
var tlsVars = require('./tlsConstants.js')
var asanaKey = process.env.ASANAKEY;
let client = null;
let tlsTagNames = {};

module.exports = {
    /**
     * Always needs to be run first to startup the connection between node and asana.
     * Everything else uses this connection to run.
     *
     * @return {Object} The connection to the Asana server
     **/
    connect: function () {
        try {
            client = asana.Client.create().useAccessToken(asanaKey);
            if (client) {
                this.updateTagNames();
            }
        }
        catch (err) {
            console.log(err);
        }
        return client;
    },

    /**
     * Sets the tlsTagNames variable with the tags currently stored in Asana for quick (cached) reference later.
     * Sets a property within tlsTagNames that represents whether the variable is okay to use and when it was last
     * updated
     *
     * @return {boolean} true if the tlsTagNames variable was set successfully, false otherwise
     */
    updateTagNames: function() {
        client.tags.findByWorkspace(tlsVars.WORKSPACE_TLS).then(function(response) {
            tlsTagNames['variableStatus'] = false;
            for(let i=0; i<response.data.length; i++) {
                tlsTagNames[response.data[i].name] = response.data[i].id;
            }
            tlsTagNames['variableStatus'] = true;
            tlsTagNames['lastUpdated'] = Date.now();
            return true;
        });
    },

    /**
     * Gets a list of all of the tasks in the asana instance
     *
     * @return {Promise} A promise containing everything marked with a specific tag in Asana
     **/
    getTasksByTag: function (tag) {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tag).then(function (list) {
                resolve(list.data);
            });
        });
    },

    /**
     * Returns all of the tasks that are unassigned
     *
     * @return {Promise} A promise containing only the unassigned requests in Asana
     **/
    getUnassigned: function () {
        return new Promise(function (resolve, reject) {
            if(tlsTagNames.variableStatus) {
                client.tasks.findByTag(tlsTagNames.captioning_unassigned).then(function (list) {
                    resolve(list.data);
                });
            }
        });
    },

    /**
     *
     * @param tagName The name of the tag you are looking up in plain english (the Asana tag name)
     * @returns {String} the Asana id that represents the tagName you've passed in. Note that this is a cached tag.
     */
    getCachedTagID: function(tagName){
        if(tlsTagNames.variableStatus){
            if(tlsTagNames[tagName]){
                return tlsTagNames[tagName];
            }
            else{
                return undefined;
            }
        }
    },

    /**
     * Returns all of the new requests
     *
     * @return {Promise} A promise containing only the new requests in Asana
     **/
    getNewRequests: function () {
        return new Promise(function (resolve, reject) {
            client.tasks.findByTag(tlsVars.TAG_NEWTASK).then(function (list) {
                resolve(list.data);
            });
        });
    },
    
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
