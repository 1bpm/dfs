/**
 *  dfscore
 *  GPL license, see COPYING
 *  copyright 2015 richard@1bpm.net  
 */

var dfs=require("./dfs.js");
var Client=require("./client.js");
var config=require("../config.json");

module.exports = function (request) {
    var self = this;
    var connection;
    var requestCache={};
    this.id=dfs.uid();
    this.connected = true;
    this.client=null;
    this.ip=null;

    var routes={
        // turned off sessions
        /*register:function(request){
            if (request.token && dfs.clients[request.token]) {
                // existing session
                dfs.log.debug("existing session registered");
                self.client=dfs.clients[request.token];
                self.client.setSession(self);
                if (self.client.state.view!=null) {
                    self.client.emit("menu", {name: self.client.name,superuser:self.client.isAdmin()});
                    self.client.lastView();
                } else {
                    dfs.log.debug("could not recall client view");
                    self.client.view("login");
                }

            } else {
                // new session
                dfs.log.debug("new session");
                var token=dfs.newToken();
                self.client=new Client(self);
                dfs.clients[token]=self.client;
                self.emit("newSession",{token:token});
                self.client.view("login");
            }
        }*/
        register:function(request){
            dfs.log.debug("new session");
            var token=dfs.newToken();
            self.client=new Client(self);
            dfs.clients[token]=self.client;
            self.emit("newSession",{token:token});
            self.client.view("login");
        }
    };


    this.quit=function() {
        dfs.log.debug(self.client.ip + " quit");
        self.emit("reset");
        self.client.quit();
        self.connected=false;
        dfs.removeClientSession(self.id);
    };

    this.emit=function(route,data,callback) {
        if (!self.connected) return;
        if (data) {
            data["route"] = route;
        } else {
            data = {route: route};
        }
        if (callback) {
            var cacheID=dfs.uid();
            data.cacheID=cacheID;
            requestCache[cacheID]=callback;
        }
        connection.sendUTF(JSON.stringify(data));
    };

    connection = request.accept(null, request.origin);
    self.ip=request.remoteAddress;

    connection.on("message", function (message) {
        var incoming=JSON.parse(message.utf8Data);
        dfs.log.debug(incoming);
        if (incoming.route && incoming.route==="cache" && incoming.cacheID in requestCache) {
            requestCache[incoming.cacheID](incoming);
            delete requestCache[incoming.cacheID];
        } else if (self.client) {
            self.client.routing(incoming);
        } else if (incoming.route && incoming.route in routes) {
            routes[incoming.route](incoming);
        }
    });

    connection.on("close", function () {
        dfs.log.debug(self.ip + " disconnected");


        // turned off sessions
        //self.client.clearSession();
        self.quit(); // this instead to sever completely

    });

}