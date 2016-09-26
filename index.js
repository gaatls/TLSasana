"use strict";

var _ = require('lodash');

var asana = require('asana');
var tlsVars = require('./tlsConstants.js')
var asanaKey = process.env.ASANAKEY;
let client = undefined;
let projectID = undefined;

let tlsUsers = {
    pendingPromise: null
};

let autoCacheTimeout = 15000;
let pageLimit = 100;

let tlsTagNames = {
    name: 'tlsTagNames',
    deferredFunctions: [],
    pendingPromise: null,
    refreshTime: 120000
};

let tlsTasks = {
    name: 'tlsTasks',
    data: [],
    deferredFunctions: [],
    pendingPromise: null,
    refreshTime: 30000
};

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

        if( !(typeof requestedProjectID == "string") ){
            throw new TypeError('Requested project ID parameter must be a string') ;
        }
        else {
            projectID = requestedProjectID;
        }

        return new Promise(function(resolve, reject){
            try {
                client = asana.Client.create().useAccessToken(asanaKey);
                if (client) {
                    tlsAsana.updateTagNames();
                    tlsAsana.updateTasks();
                    tlsAsana.autoCacheCheck(autoCacheTimeout);
                    resolve(client);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    },



    /**
     * Gets all the users that we are authorized access to with the current API key.
     * Sets a property within tlsUsers that represents the last promise that was created that may or may not be fulfilled.
     *   
     * @return {Promise} Promise returned by Asana API, fulfilled with user data
     */
    updateUsers: function() {
        tlsUsers.pendingPromise = new Promise( function(resolve, reject){
            client.users.findByWorkspace(36641419235321, {'opt_fields': 'id,name,email'}).then(response => {
                tlsUsers.data = response.data;
                tlsUsers.lastUpdated = Date.now();
                resolve(response);
            }).catch( err => reject(err) );
        });

        return tlsUsers.pendingPromise;
    },



    /**
     * Sets the tlsTagNames variable with the tags currently stored in Asana for quick (cached) reference later.
     * Sets a property within tlsTagNames that represents the last promise that was created that may or may not be fulfilled.
     *
     * @return {Promise} Promise returned by Asana API, fulfilled with tag data
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
            }).catch( err => reject(err) );
        });

        return tlsTagNames.pendingPromise;
    },



    /**
     * Sets the tlsTasks variable with the tasks currently stored in Asana for quick (cached) reference later.
     * Sets a property within tlsTasks that represents the last promise that was created that may or may not be fulfilled.
     *
     * @return {Promise} Promise returned by Asana API, fulfilled with task data
     */
    updateTasks: function(){
        let tlsAsana = this;
        
        tlsTasks.pendingPromise = new Promise( function(resolve, reject){
            client.tasks.findByProject(projectID, {limit: pageLimit, opt_fields: 'id,name,projects,assignee,external,created_at,tags.name,tags.color'}).then(function(response){
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
            }).catch( err => reject(err) );
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
            }).catch( err => reject(err) );
        });
    },



    /**
     * Checks when a cache was last updated and sees if it needs to be refreshed
     * 
     * @param {Object} cache - Local cache that may need to be updated
     * @param {Function} updateFunc - Name of the function that will be called if update is necessary
     * @return {Promise} Promise from the cache function that could be finished or in progress 
     *                   (cache.pendingPromise), or just being created (updateFunc)
     */
    checkLastCacheUpdate: function(cache, updateFunc){
        //If cache has never been updated see if we can access the pending
        //update promise-if not, explicitly update this cache
        if(!cache.lastUpdated){
            if(cache.pendingPromise){
                return cache.pendingPromise;
            }
            else {
                return updateFunc();
            }
        }
        else if( ( Date.now() - cache.lastUpdated ) >= cache.refreshTime ) {
            //console.log( cache.name + ' cache age X, it is ' + (Date.now() - cache.lastUpdated) + 'ms old --- !!!'); 
            return updateFunc();
        }
        else {
            //console.log( cache.name + ' cache age $, it is ' + (Date.now() - cache.lastUpdated) + 'ms old'); 
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
     * 
     */
    autoCacheCheck: function(timeout){
        let tlsAsana = this;

        return new Promise(function(resolve, reject){
            setTimeout(function(){
                resolve(tlsAsana.checkBothCaches());
            }, timeout);
        }).then(() => {
            return tlsAsana.autoCacheCheck(timeout);
        }).catch( err => reject(err) );
    },


    /**
     * Check the age of the task cache and then gets a list of all of the cached 
     * tasks that have a tag with the passed ID
     *
     * @param {Number} tag Tag Id number
     * @return {Array} Array containing all task objects with a specific tag in Asana
     **/
    getTasksByTag: function (tag) {
        return this.checkTaskCache().then(function(){
            return _.filter(tlsTasks.data, function(x){
                return _.find(x.tags, {'id': tag});
            });
        }).catch( err => reject(err) );
    },



    /**
     * Looks for a the local tag cache for a plain english tag name and returns the corresponding
     * Asana tag ID.
     * 
     * @param tagName The name of the tag you are looking up in plain english (the Asana tag name)
     * @returns {String} the Asana id that represents the tagName you've passed in. Note that this is a cached tag.
     */
    getTagIDByName: function(tagName){
        return this.checkTagCache().then(function(){
            if(tlsTagNames[tagName]){
                return tlsTagNames[tagName];
            }
            else{
                throw new Error('Error, no tag exists in the cache with that name');
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
        }).catch( err => reject(err) );
    },



    /**
     * Check the tag and task cache ages and then returns all of the tasks that are unassigned
     *
     * @return {Array} An array containing the task objects that have an unassigned tag
     **/
    getUnassignedTasks: function () {
        var tlsAsana = this;
        
        return this.checkBothCaches().then(function(){
            return tlsAsana.getTasksByTag( tlsTagNames.captioning_unassigned );
        }).catch( err => reject(err) );
    },



    /**
     * Returns all of the new requests
     *
     * @return {Promise} A promise containing only the new requests in Asana
     **/
    getNewTasks: function () {
        var tlsAsana = this;
        
        return this.checkBothCaches().then(function(){
            return tlsAsana.getTasksByTag( tlsTagNames['New Request'] );
        }).catch( err => reject(err) );
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
            }).catch( err => reject(err) );
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
    },


    /**
     * Create new task
     */
    //createTask: function(projectID, name, description, due_date, dataObj){
    createTask: function(name, dataObj){
        
        //1. Have to handle assignee here...have to make a function to 
        //   look at assignee data and get an id by a name or something

        //2. Just have to quick test the due_date to make sure thats what the 
        //   API wants----may also have to do some JS date formatting

        console.log('data submitted to createTask func')
        console.log(dataObj);

        return client.tasks.create({
                'name': name,
                'description': 'description',
                'assignee': {'id': '170705266868499'},
                'workspace': 36641419235321,
                'projects': projectID,
                'external': {
                    'data': JSON.stringify(dataObj)
                }
            }
        );
        
    }


}
