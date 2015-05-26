var dfs=require("./dfs.js");

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

module.exports = function (xmlnode) {
    var self=this;
    this.id = dfs.uid();
    this.name=xmlnode.get("name");
    this.instrument=xmlnode.get("instrument");
    this.clef=xmlnode.get("clef");
    this.key=xmlnode.get("key");
    if (xmlnode.get("maxPerformers")) {
        this.maxClients=xmlnode.get("maxPerformers");
    } else {
        this.maxClients = 1;
    }
    this.events = {};
    this.triggers = {};
    this.listeners = {};
    this.initScript = null;
    this.clients={};
    this.currentEvent = 0;
    this.preAmble=null;
    this.active = false;
    var routes={

    };

    console.log("create ")

    this.isAssignable=function() {
        if (self.clients && Object.size(self.clients)>=self.maxClients) {
            return false;
        } else {
            return true;
        }
    };

    this.getData=function() {
        return {
            id:self.id,
            name:self.name,
            clef:self.clef,
            instrument:self.instrument,
            key:self.key,
            events:self.events,
            triggers:self.triggers,
            listeners:self.listeners,
            initScript:self.initScript,
            preamble:self.preAmble

        };
    }

    this.getOverview=function() {
        var data= {
            id:self.id,
            name:self.name,
            assignable:self.isAssignable(),
            clef:self.clef,
            instrument:self.instrument,
            key:self.key

        };
        if (self.clients) {
            data.clients={};
            for (var client in self.clients) {
                var client = self.clients[client];
                if (client) {

                    data.clients[client.id] = {
                        name: client.name,
                        ip: client.ip,
                        token: client.token
                    };
                }
            }
        }
        return data;
    };

    this.eachClient=function(callback) {
        for (var client in self.clients) {
            callback(self.clients[client]);
        }
    };

    this.addInit=function(init) {
        self.initScript=init;
    };

    this.addTrigger=function(trigger) {
        self.triggers[trigger.id]=trigger;
    };

    this.addListener=function(listener) {
        self.listeners[listener.id]=listener;
    };

    this.addEvent=function(event) {
        self.events[event.id]=event;
    };

    this.setPreamble=function(data) {
        self.preAmble=data;
    };

    this._emit=function(type,objData) {
        // setTimeout?
        for (var client in self.clients) {
            if (self.clients[client])
                self.clients[client].emit(type,objData);
        }
    }

    this.emit=function(route,objData) {
        if (self.clients===null) return;
        var data;
        if (objData) {
            data={role:objData};
            data.role["route"]=route;
        } else {
            data={role:{route:route}};
        }
        self._emit("role",data);
    };

    this.runEvent=function(id,duration,miniID) {
        self.emit("runEvent",{id:id,duration:duration,mini:miniID});
        self.eachClient(function(client){
            client.performedEvents[id]={duration:duration,completed:false,confirmed:false,stamp:new Date().getTime()};
            setTimeout(function(){
                if (client.performedEvents[id].confirmed!==true) {
                    dfs.log.warn("event acknowledgement delayed by more than 50ms");
                }
            },50);
        });


    };


    this.routing = function (request) {
        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown performer route " + request.route);
        }
    };


};


