var dfs = require("./dfs.js");
var Admin = require("./admin.js");
var config = require("../config.json");
var user = require("./userPerformance.js");

module.exports = function (session) {
    var self = this;
    var clientSession;
    this.id = dfs.uid();
    this.name = null;
    this.superuser = null;
    this.role = null;
    this.observer = null;
    this.token = null;
    this.ip = null;
    this.connected = true;
    this.view = {};
    this.performanceReady = false;
    this.performedEvents = {};

    this.performer = null;


    var routes = {
        performanceStart: function (request) {
            self.performanceReady = true;
        },
        eventComplete: function (request) {
            var item = self.performedEvents[request.tid];
            item.completed = true;
            item.runtime = new Date().getTime() - item.stamp;
            item.latency = item.runtime - item.duration;
            self.performedEvents[request.tid] = item;
            dfs.log.debug("event " + request.id + " latency " + item.latency + "ms");
        },
        eventAcknowledged: function (request) {
            var item = self.performedEvents[request.tid];
            item.confirmed = true;
            item.ackLatency = (new Date().getTime() - item.stamp)*0.5;
            self.performedEvents[request.tid] = item;
            dfs.log.debug("event acknowledgement latency " + item.ackLatency + "ms");
        },
        admin: function (request) {
            if (self.superuser === null) {
                self.emit("log", {level: "warn", text: "only available for superuser"});
            } else {
                var iReq = request.admin;
                self.superuser.routing(iReq);
            }
        },
        trigger: function (request) {
            try {
                user.space.trigger(request.id);
            } catch (e) {
                dfs.log.warn("trigger " + request.id + " does not exit in performance");
            }
        },
        performance: function (request) {
            if (!dfs.performance) {
                self.emit("log", {level: "warn", text: "no performance loaded"});
            } else {
                dfs.performance.routing(request, function (type, objData) {
                    if (objData) {
                        objData["route"] = type;
                        //?????       } else {
                        objData = {route: type};
                    }
                    self.emit("performance", {performance: objData});
                });
            }
        },
        quit: function (request) {
            dfs.performance.removeClient(self.id);
        },
        registerObserver: function (request) {
            self.observer();
        },
        doLogin: function (request) {
            var restrictedNames = ["all"];
            var name = request.name;
            if (name in restrictedNames) {
                return self.emit("log", {level: "warn", text: "that name is reserved"});
            }
            if (name in dfs.getClientNames()) {
                return self.emit("log", {level: "warn", text: "that name is already assigned"});
            }

            //try {
            self.name = name;
            self.performer = user.space.newPerformer(self);
            //} catch (e) {
            //return self.emit("log",{level:"warn",text:e});
            //}
            if (name === config.adminUser && request.password) {
                if (request.password === config.adminPassword) {
                    self.superuser = new Admin(function (route, objData) {
                        try {
                            objData["route"] = route;
                        } catch (error) {
                            objData = {route: route};
                        }
                        self.emit("su", {su: objData});
                    }, self);

                    self.emit("menu", {name: name, superuser: true});

                    if (!dfs.performance) {
                        self.superuser.listPackages();
                    } else {
                        self.emit("availableRoles", {
                            roles: dfs.performance.roles,
                            meta: dfs.performance.meta});
                    }

                } else {
                    self.emit("log", {level: "error", text: "Wrong password"});
                }

            } else { // not admin


                return;

                var performance = null;
                self.emit("menu", {name: name});
                if (dfs.performance) {
                    performance = {
                        meta: dfs.performance.meta,
                        roles: dfs.performance.roles
                    };
                    self.view("roleChoice", performance);
                } else {
                    self.view("loading", {
                        title: "Awaiting conductor",
                        text: "Please wait while the conductor sets up the current performance"
                    });
                }


            }
        },
        log: function (req) {
            var err = "[" + self.name + "]: " + req.text;
            switch (req.level) {
                case "fatal":
                    dfs.log.fatal(err);
                    break;
                case "warn":
                    dfs.log.warn(err);
                    break;
                case "notify":
                    dfs.log.notify(err);
                    break;
                case "debug":
                    dfs.log.debug(err);
                    break;
            }
            ;
        },
        quitRole: function (request) {
            //self.view("");
            self.quitRole();

        },
        selectRole: function (request) {
            //  try {
            dfs.log.debug("trying to get role " + request.name);


            var role = user.space.getRole([request.name]);

            //with (user.space) {
            //var role=eval("(function() { roles['" + request.name + "']})();");
            //var role=eval('(roles["'+request.name+'"])');
            //eval('(roles["'+request.name+'"]');
            //}
            //console.log()
            //with (user.space) {
            //    var role = user.space.roles[request.name];
            //}
            //var role = dfs.performance.roles[request.id];
            if (!role.assignable) {
                self.emit("log", {level: "warn", text: "That role is already assigned"});
            } else if (self.role) {
                self.emit("log", {level: "warn", text: "You already have a role"});
            } else if (!self.performer) {
                self.emit("log", {level: "warn", text: "You do not appear to have registered as a performer"});
            } else {
                self.view("loading", {
                    title: "Transferring role information",
                    text: "Please wait while the role data is transferred to your computer"
                });
                self.role = role;
                role.addPerformer(self.performer);



                return;
                // /role.clients[self.id]=self;
                self.role = role;
                dfs.emit("performanceAvailable", {
                    roles: dfs.performance.getRoleOverviews(),
                    meta: dfs.performance.meta,
                    styles: dfs.performance.styles,
                    resources: dfs.performance.resources,
                    intro: dfs.performance.introductionText
                });
                self.view("performanceReady", role.getData());
                self.performanceReady = false;

            }
            // } catch (error) {
            //     self.emit("log", {level:"error",text: "could not assign role: " + error});
            // }
        },
        role: function (request) {
            if (self.role) {
                self.role.routing(request.role);
            } else {
                self.emit("log", {level: "warn", text: "no role loaded"});
            }
        }
    };

    this.eval = function (request, callback) {
        self.emit("eval", {code: request}, function (output) {
            callback(output.result);
        });
    };

    this.isAdmin = function () {
        if (self.superuser) {
            return true;
        } else {
            return false;
        }
    };

    this.lastView = function () {
        //self.view(self.state.view,self.state.data);
        dfs.log.debug("lastview called for " + self.state.view);
    };

    this.observer = function () {
        if (!dfs.performance) {
            self.emit("error", {text: "no performance loaded"});
        } else {
            self.observer = true;
            self.emit("observer", {
                route: "data", inspector: {
                    events: dfs.performance.events,
                    roles: dfs.performance.roles
                }
            });
        }
    };

    this.listActiveRoles = function () {
        var out = {key: [], Name: {}, Assigned: [], Select: []};
        dfs.performance.eachRole(function (role) {
            out.key.push(id);
            out.Name.push(role.roleName);
            var assigned = "";
            out.Select.push(role.isAssignable());
            if (role.hasClient()) {
                role.eachClient(function (client) {
                    assigned += client.name + ": " + client.ip + "<br>";
                });
            } else {
                assigned = "Not assigned";
            }
            out.Assigned.push(assigned);
        });
        return out;
    };

    this.view = function (viewName, data) {
        //self.state={view:viewName,data:data};
        self.emit("view", {state: viewName, data: data});
    };

    this.quit = function () {
        self.quitRole();
        dfs.removeClient(self.token);
    };

    this.quitRole = function () {
        user.space.delPerformer(self.performer);return;
        //if (self.role) delete self.role.clients[self.name];
        self.role = null;
        self.observer = null;
        //user.space.roles[self.name];
        if (dfs.performance && !dfs.live) {
            dfs.emit("performanceAvailable", {
                roles: dfs.performance.getRoleOverviews(),
                meta: dfs.performance.meta,
                intro: dfs.performance.introductionText
            });
        }
    };

    this.refreshRoles = function () {
        dfs.emit("AvailableRoles", {roles: Dfs.performance.GetRoles()});
        dfs.emit("ListActiveRoles", {roles: Dfs.getAdmin().listActiveRoles()});
    };

    this.emit = function (route, objData, callback) {
        if (!self.connected)
            return;
        if (objData) {
            objData["route"] = route;
        } else {
            objData = {route: route};
        }

        clientSession.emit(route, objData, callback);

    };

    this.getLatency = function () {
        var levents = {max: 0, avg: 0, list: [], total: 0};
        var acks = {max: 0, avg: 0, list: [], total: 0};
        for (var ev in self.performedEvents) {
            var thisEvent = self.performedEvents[ev];
            if (thisEvent.completed) {
                var evLat = thisEvent.runtime - thisEvent.length;
                if (evLat > levents.max)
                    levents.max = evLat;
                levents.list.push(evLat);
                levents.total += evLat;

                var akLat = thisEvent.ackLatency;
                if (akLat > acks.max)
                    acks.max = akLat;
                acks.list.push(akLat);
                acks.total += akLat;
            }
        }
        if (levents.total > 0)
            levents.avg = levents.list.total / levents.list.length;
        if (acks.total > 0)
            acks.avg = acks.list.total / acks.list.length;
        return {events: levents, acks: acks};
    };

    this.setSession = function (theSession) {
        clientSession = theSession;
        self.ip = clientSession.ip;
        self.connected = true;
    };

    this.clearSession = function () {
        clientSession = null;
        self.ip = null;
        self.connected = false;
    };

    this.routing = function (request) {
        if (request.route in routes) {
            try {
                routes[request.route](request);
            } catch (e) {
              
                dfs.log.warn("client routing error: " + e);
            }
        } else {
            dfs.log.warn("unknown client route " + request.route);
        }
    };

    if (session)
        self.setSession(session);



};

