/**
 * Created by bargepole on 23/05/15.
 */
var dfs=require("./dfs.js");
var user=require("./userPerformance.js");
var EventDespatcher=require("./despatcher.js");
var DisplayEvent=require("./displayEvent.js");

module.exports = function () {
    var self = this;
    this.dir=null;
    this.observers={};
    this.meta = {};
    this.roles = {};
    this.events = {};
    this.introductionText=null;
    this.triggers = {};
    this.resources ={};
    this.styles={};
    this.despatcher=null;
    var runtime=0;
    var observerCount=1;
    var routes={
        startObserve:function(request){
            if (request.token && request.token in dfs.clients &&
                    !(request.token in self.observers))  {
                dfs.clients[request.token].observer=true;
                dfs.clients[request.token].name="Observer "+observerCount;
                observerCount++;
                self.observers[request.token]=dfs.clients[request.token];
            } else if (request.token in self.observers) {

            }
        },
        stopObserve:function(request){
            if (request.token in self.observers) {
                self.observers[request.token]=null;
            }
        }
    };

    /**
     * Emit an object to each role's performers with an optional callback
     * @param route route name
     * @param objData object to emit
     * @param callback optional request caching callback
     */
    this.emit=function(route,objData,callback) {
        var data;
        dfs.log.debug("performance emit "+route);
        if (objData) {
            data=objData;
            data["route"]=route;
        } else {
            data={route:route};
        }

        self.eachPerformer(function(perf){
            if (perf)
                perf.emit("role",{role:data},callback);
        });
    };

    this.getRoleOverviews=function() {
        var returnData=[];
        self.eachRole(function(role){
            returnData.push(role);
        });
        return returnData;
    };

    this.addStyle=function(style) {
        self.resources.styles[dfs.uid()]=style;
    };

    this.addEvent = function (event) {
        self.events[event.id] = event;
    };

    this.getResourcePath = function (id) {
        return path.join(self.dir, self.resources.files[id]);
    };

    this.addResource = function (resource) {
        self.resources.files[resource.id] = resource;
    };

    this.hasRole=function(name) {
        var returnVal=false;
        self.eachRole(function(role){
            if (role.name===name) {
                returnVal=true;
            }
        });
        return returnVal;
    };


    this.getRole = function (name) {
        var returnVal=null;
        self.eachRole(function(role) {
            if (role.name===name) {
                returnVal=role;
            }
        });
        return returnVal;
    };

    this.eachObserver=function(callback) {
        for (var observer in self.observers) {
            callback(self.observers[observer]);
        }
    };

    this.eachRole = function (callback) {
        for (var role in user.space.roles) {
            callback(self.roles[role]);
        }
    };

    this.eachPerformer=function(callback) {
        self.eachRole(function(role) {
            for (var client in role.clients) {
                callback(role.clients[client]);
            }
        });
    };

    /**
     * Run the performance
     * @param countIn an optional preparation/warning time in ms, defaulting to 5000
     */
    this.run = function (countIn) {

        return;

        if (!countIn) countIn=5000;
        self.emit("performanceStart",{countIn:countIn});
        self.despatcher=new EventDespatcher(self);
        setTimeout(function(){
            var ready=true;
            self.eachPerformer(function(client){
                if (client.performanceReady!=true) {
                    ready=false;
                    dfs.log.warn(client.name + " is not ready");
                    dfs.view("fatal",{
                        title:"False start",
                        text:"Not all performers are ready. This may be because a session was interrupted between registering and start of the performance."
                    });
                    setTimeout(function(){
                        dfs.view("clearFatal");
                    },5000);
                };
            });
            if (ready) {
                runtime=process.hrtime();
                self.despatcher.begin();
            }
        },countIn);





    };

    /**
     * Make the roles aware that the performance is being terminated
     */
    this.clear = function () {
        ready=false;
        for (index in performers) {
            performers[index].clear();
        }
    };

    /**
     * Get current runtime since instantiation
     * @returns {number}
     */
    this.getRunTime = function () {
        return process.hrtime() - runtime;
    };

    /**
     * Handle incoming messages
     * @param request the message object
     */
    this.routing = function (request) {
        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown performance route " + request.route);
        }
    };



};