"use strict";
//for when we bring in lodas..got to put in package.json and install first
var _ = require('lodash');


var asana = require('asana');
var tlsVars = require('./tlsConstants.js')
var asanaKey = process.env.ASANAKEY;
let client = undefined;
let projectID = undefined;
let tlsTagNames = {
    refreshTime: 120000
};
let tlsTasks = {
    data: [],
    refreshTime: 30000
};
let pageLimit = 100;

//stores the static info associated with the tag and task
//requests so that we don't have to pass a million parameters
//when there are multiple pages of data
let asanaRequestDetails = {
    tags: {
        apiFunction: 'findByWorkspace', 
        identifier: tlsVars.WORKSPACE_TLS
    },
    tasks: {
        apiFunction: 'findByProject',
        identifier: projectID
    }
}

module.exports = {


    /**
     * Always needs to be run first to startup the connection between node and asana.
     * Everything else uses this connection to run.
     *
     * @param {String} requestedProjectID The id of the project that all other functions will refer to
     * @return {Object} The connection to the Asana server
     **/
    connect: function (requestedProjectID) {
        let tlsAsana = this;
        projectID = requestedProjectID;

        return new Promise(function(resolve, reject){
            try {
                client = asana.Client.create().useAccessToken(asanaKey);
                if (client) {
                    tlsAsana.updateTagNames().then(
                        tlsAsana.updateTasks().then(
                            function(response){
                                //console.log(response);
                                resolve(true);
                            }
                        )
                    );
                    resolve(true);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Sets the tlsTagNames variable with the tags currently stored in Asana for quick (cached) reference later.
     * Sets a property within tlsTagNames that represents whether the variable is okay to use and when it was last
     * updated
     *
     * @return {boolean} true if the tlsTagNames variable was set successfully, false otherwise
     */
    updateTagNames: function() {
        let tlsAsana = this;

        return new Promise( function(resolve, reject){
            client.tags.findByWorkspace(tlsVars.WORKSPACE_TLS, {limit: pageLimit}).then(function(response) {
                if( response != undefined) {
                    //hayden..if there are more pages let get the other pages of responses
                    if(response._response.next_page){
                        tlsAsana.combinePaginatedData('tags', response).then(function(response){
                            updateTlsTagCache(response);
                            resolve(true);
                        });
                    }
                    else {
                        updateTlsTagCache(response.data);
                        resolve(tlsTagNames);
                    }
                }
                else{
                    resolve(false);
                }

                function updateTlsTagCache(fullTagData){
                    tlsTagNames['variableStatus'] = false;

                    _.forEach(fullTagData, function(value, key){
                        tlsTagNames[value.name] = value.id;
                    });

                    tlsTagNames['variableStatus'] = true;
                    tlsTagNames['lastUpdated'] = Date.now();
                }
            });
        });
    },



    updateTasks: function(){
        let tlsAsana = this;
        
        return new Promise( function(resolve, reject){
            client.tasks.findByProject(projectID, {limit: pageLimit, opt_fields: 'id,name,created_at,tags.name,tags.color'}).then(function(response){
                if(response != undefined){
                    //hayden..if there are more pages let get the other pages of responses
                    if(response._response.next_page){
                        tlsAsana.combinePaginatedData('tasks', response).then(function(response){
                            updateTlsTaskCache(response);
                            resolve(tlsTasks);
                        });
                    }
                    else {
                        updateTlsTaskCache(response.data);
                        resolve(tlsTasks);
                    }
                }
                else{
                    resolve(false);
                }

                function updateTlsTaskCache(fullTaskData){
                    tlsTasks['variableStatus'] = false;

                    tlsTasks.data = [];
                    _.forEach(fullTaskData, function(value, key){
                        tlsTasks.data.push(value);
                    });

                    tlsTasks['variableStatus'] = true;
                    tlsTasks['lastUpdated'] = Date.now();
                }
            });
        });
    },


    /**
     * Concatonates data arrays -- for now it is the tag names and ids, but I think I can use it for
     * tasks as well. Will change the name if I can use it for tasks also.
     * 
     * @param {String} type Request type from Asana API (currently tags or tasks)
     * @param {Object} previousResponse Full Asana response that was paginated
     * @return {Promise} An array of data objects 
     */
    combinePaginatedData: function(type, previousResponse){
        let tlsAsana = this;
        let offsetHash = previousResponse._response.next_page.offset;

        //Asana API function needed to get paginated data
        let apiFunction = asanaRequestDetails[type].apiFunction;
        
        //Name of id used with Asana API function (workspaceId or projectId currently)
        let identifier = asanaRequestDetails[type].identifier;
        
        return new Promise( function(resolve, reject){
            client[type][apiFunction](identifier, {limit: pageLimit, offset: offsetHash}).then(function(response){
                if(response._response.next_page){
                    tlsAsana.combinePaginatedData(type, response).then(function(response){
                        //combine the previous page's data with the current page
                        let combinedTagData = previousResponse.data.concat(response);
                        resolve(combinedTagData);
                    });
                }else{
                    //combine last page of data with the previous pages' data
                    let combinedTagData = previousResponse.data.concat(response.data);
                    resolve(combinedTagData);
                }
            });
        });
    },


    /**
     * Checks when a cache was last updated and sees if it needs to be refreshed
     * 
     * @param {Object} cache Local cache that may need to be updated
     * @param {Function} updateFunc Name of the function that will be called if update is necessary
     * @param {Number} refreshOverride Overrides set refresh value, using to test with a 0 refresh value so function always refreshes the cache
     * @return {Bool} True if cache needed to be updated, otherwise false (hayden...using for testing, may not need)
     */
    checkLastCacheUpdate: function(cache, updateFunc, refreshOverride){
        //this is crazy, but I put in so I could test this cache update function...will change next week
        if(Number.isInteger(refreshOverride) && refreshOverride != undefined) cache.refreshTime = refreshOverride;

        if( ( Date.now() - cache.lastUpdated ) >= cache.refreshTime ) {
            console.log('      Cache needs to be refreshed');
            updateFunc();
            return true;
        }
        else {
            console.log("      Cache age is acceptable, it's only " + (Date.now() - cache.lastUpdated) + ' ms old');
            return false;
        }
    },


    /**
     * Gets a list of all of the cached tasks in the asana instance that match a tag Id
     *
     * @param {String or Number} tag Tag Id number
     * @return {Promise} A promise containing everything marked with a specific tag in Asana
     **/
    getTasksByTag: function (tag) {
        if( !_.isNumber(tag) || _.includes(tlsTagNames, tag)) throw 'Error, parameter is not a number or not an existing tag id number';

        return _.filter(tlsTasks.data, function(x){
            return _.find(x.tags, {'id': tag});
        })
    },





    /**
     * Returns all of the tasks that are unassigned
     *
     * @return {Promise} A promise containing only the unassigned requests in Asana
     **/
    getUnassigned: function () {
        //sample of checking for local cache age ...will need to do in more places and maybe differently next week
        this.checkLastCacheUpdate(tlsTagNames, this.updateTagNames);

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
        // return new Promise(function (resolve, reject) {
        //     client.tasks.findById(taskID).then(function(task){
        //         resolve(task);
        //     });
        // });

        return _.find(tlsTasks.data, function(x){
            return x.id == taskID;
        })
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
    * @return {Promise} A promise containing the list of all of the sections within a project
    */
    getAllSections: function(){
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
    */
    moveTaskToSection: function(taskID, newSection){
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
