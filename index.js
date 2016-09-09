"use strict";
//for when we bring in lodas..got to put in package.json and install first
var _ = require('lodash');


var asana = require('asana');
var tlsVars = require('./tlsConstants.js')
var asanaKey = process.env.ASANAKEY;
let client = undefined;
let projectID = undefined;
let tlsTagNames = {
    name: 'tlsTagNames',
    deferredFunctions: [],
    pendingPromise: null,
    refreshTime: 10000
};
let tlsTasks = {
    name: 'tlsTasks',
    data: [],
    deferredFunctions: [],
    pendingPromise: null,
    refreshTime: 10000
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

    testCache: {
        name: 'testCache',
        lastUpdated: Date.now(),
        refreshTime: 0,
        testRefresh: function(){
            return;
        }
    },

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
                    tlsAsana.updateTagNames();
                    tlsAsana.updateTasks();
                    resolve(client);
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

        tlsTagNames.pendingPromise = new Promise( function(resolve, reject){
            client.tags.findByWorkspace(tlsVars.WORKSPACE_TLS, {limit: pageLimit}).then(function(response) {
                if( response != undefined) {
                    //hayden..if there are more pages let get the other pages of responses
                    if(response._response.next_page){
                        tlsAsana.combinePaginatedData('tags', response).then(function(response){
                            updateTlsTagCache(response);
                            resolve(tlsTagNames);
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
                    _.forEach(fullTagData, function(value, key){
                        tlsTagNames[value.name] = value.id;
                    });

                    tlsTagNames['lastUpdated'] = Date.now();
                }
            });
        });

        return tlsTagNames.pendingPromise;
    },



    updateTasks: function(){
        let tlsAsana = this;
        
        tlsTasks.pendingPromise = new Promise( function(resolve, reject){
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
                    tlsTasks.data = [];
                    _.forEach(fullTaskData, function(value, key){
                        tlsTasks.data.push(value);
                    });

                    tlsTasks['lastUpdated'] = Date.now();
                }
            });
        });

        return tlsTasks.pendingPromise;
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
     * @return {Bool} True if cache needed to be updated, otherwise false (hayden...using for testing, may not need)
     */
    checkLastCacheUpdate: function(cache, updateFunc){
        if(!cache.lastUpdated){
            if(cache.pendingPromise){
                return cache.pendingPromise;
            }
            else {
                return updateFunc();
            }
        }
        
        if( ( Date.now() - cache.lastUpdated ) >= cache.refreshTime ) {
            //console.log('      ' + cache.name + ' cache needs to be refreshed');
            return updateFunc();
        }
        else {
            //console.log('      ' + cache.name + " cache age is acceptable, it's only " + (Date.now() - cache.lastUpdated) + ' ms old');
            return cache.pendingPromise;
        }
    },


    /**
     * Simplifies the tag cache check function call because it is repeated frequently
     */
    checkTagCache: function(){
        return this.checkLastCacheUpdate(tlsTagNames, this.updateTagNames);
    },


    /**
     * Simplifies the task cache check function call because it is repeated frequently
     */
    checkTaskCache: function(){
        return this.checkLastCacheUpdate(tlsTasks, this.updateTasks);
    },


    /**
     * Simplifies the call to both the tag and task cache check function calls because 
     * they are repeated frequently
     */
    checkBothCaches: function(){
        let promiseArray = [        
            this.checkLastCacheUpdate(tlsTagNames, this.updateTagNames),
            this.checkLastCacheUpdate(tlsTasks, this.updateTasks)
        ];

        return Promise.all(promiseArray);
    },


    /**
     * Check the age of the task cache and then gets a list of all of the cached 
     * tasks that have a tag with the passed ID
     *
     * @param {Number} tag Tag Id number
     * @return {Array} Array containing all task objects with a specific tag in Asana
     **/
    getTasksByTag: function (tag) {
        this.checkTaskCache();

        return _.filter(tlsTasks.data, function(x){
            return _.find(x.tags, {'id': tag});
        })
    },


    /**
     * Check the tag and task cache ages and then returns all of the tasks that are unassigned
     *
     * @return {Array} An array containing the task objects that have an unassigned tag
     **/
    getUnassignedTasks: function () {
        this.checkBothCaches();
        let id = tlsTagNames.captioning_unassigned;

        return this.getTasksByTag(id);
    },


    /**
     * Looks for a the local tag cache for a plain english tag name and returns the corresponding
     * Asana tag ID.
     * 
     * @param tagName The name of the tag you are looking up in plain english (the Asana tag name)
     * @returns {String} the Asana id that represents the tagName you've passed in. Note that this is a cached tag.
     */
    getTagIDByName: function(tagName){
        this.checkTagCache();

        return tlsTagNames.pendingPromise.then(function(){
            if(tlsTagNames[tagName]){
                return tlsTagNames[tagName];
            }
            else{
                throw 'Error, no tag with that name exists in the cache';
            }
        });
    },

    /**
     * Checks the task cache age and returns information about a specific task
     *
     * @param taskID - the id of the cached task we are interested in
     * @return {Object} Information about a specific task in the task cache
     **/
    getTaskInfoByID: function (taskID) {
        return this.checkTaskCache().then(function(){
            return _.find(tlsTasks.data, function(x){
                return x.id == taskID;
            })
        });
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
        let tlsAsana = this;
        
        let promiseArray = [
            this.getTagIDByName(oldTag),
            this.getTagIDByName(newTag)
        ];

        return Promise.all(promiseArray).then(IDresponses => {
            return new Promise( function(resolve, reject){
                client.tasks.removeTag(taskID, {tag: IDresponses[0] }).then(response => {                
                    client.tasks.addTag(taskID, {tag: IDresponses[1] }).then(response => {
                        tlsAsana.updateTasks(); //update the local task cache if we changed the tags associated with a task
                        resolve(response);  
                    });
                }).catch(reason => { //catch any errors from the call to Asana
                    console.log(reason);
                    reject(reason);
                });
            });
        }).catch(reason => { //catch any errors from the Promise.all promise
            console.log(reason);
            reject(reason);
        });
    }

}
