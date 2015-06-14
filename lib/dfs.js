var config=require("../config.json");
var ClientSession=require("./clientSession.js");
var fs=require("fs");
var self=this;
this.performance=null;
this.clientSessions={};
this.clients={};
var _idCounter=0;

/**
 * write to a specified log file
 * @param {string} name the log file name
 * @param {string} detail the details to write to it
 * @returns {undefined}
 */
function writeLog(name, detail) {
    var toWrite = logFormat(detail);
    fs.appendFileSync("./log/" + name + ".log", toWrite);
    console.log(("     " + name).slice(-6) + "| " + toWrite);
    
};

/**
 * format a log string with datetime and padding
 * @param {string} detail the string to sort out
 * @returns {string} the formatted string
 */
function logFormat (detail) {
    var dt = new Date();
    var format = dt.getDate() + "/" +
        (dt.getMonth() + 1) + "/" +
        dt.getFullYear() + ":" +
        dt.getHours() + ":" +
        dt.getMinutes() + ":" +
        dt.getSeconds() + ": ";
    return format + detail + "\n";
};



this.log = {
    /**
     * fatal error
     * @param {string} detail error details
     * @param {boolean} terminate whether to show trace/terminate
     * @returns {undefined}
     */
    fatal: function (detail, terminate) {
        writeLog("fatal", detail);
        if (terminate) {
            console.trace(detail);
        }
    },
    /**
     * warn error
     * @param {string} detail error details
     * @returns {undefined}
     */
    warn: function (detail) {
        writeLog("warn", detail);
    },
    /**
     * notify error
     * @param {string} detail notify/error details
     * @returns {undefined}
     */
    notify: function (detail) {
        writeLog("notify", detail);
    },
    /**
     * conditional debug message
     * @param {string} detail debug message to log
     * @returns {undefined}
     */
    debug: function (detail) {
        if (config.debug) {
            writeLog("debug", detail);
        }
    }
};

this.activeRoles=function() {
    var out = {name: [], ip: [], ready: [], role: []};
    self.eachClient(function (client) {
        out.ip.push(client.ip);
        out.name.push(client.name);
        if (client.performer) {
            out.role.push(client.performer);
            out.ready.push(true);
        } else {
            out.role.push(null);
            out.ready.push(false);
        }
    });
    return out;
};

this.newToken=function() {
    _idCounter++;
    var d = new Date();
    var seconds = d.getTime();
    var id = (seconds + _idCounter).toString(16);
    return id;
};

this.uid=function(){
    _idCounter++;
    return "dfs"+_idCounter;
};

this.getClientNames=function(){
    var names=[];
    self.eachClient(function(client){
        names.push(client.name);
    });
    return names;
};

this.eachClient = function (callback) {
    for (var client in self.clients) {
        callback(self.clients[client]);
    };
};

this.getAdmin = function () {
    for (var client in self.clients) {
        if (self.clients[client].isAdmin()) {
            return self.clients[client];
        }
    }
};

this.removeClient=function(token) {
    delete self.clients[token];
};

this.removeClientSession=function(id) {
    delete self.clientSessions[id];
}


this.clientConnect=function(request) {
    self.log.debug("ws connect from "+request.origin);
    var session=new ClientSession(request);
    self.clientSessions[session.id]=session;

};

this.emitSu=function(type,objData) {
    var adm = self.getAdmin();
    if (adm) {
        adm.superuser.emit(type, objData);
    }
};

this.view=function(viewName,data) {
    self.eachClient(function(client){
        client.view(viewName,data);
    });
};

this.emit=function(route,objData) {
    this.eachClient(function(client){
        client.emit(route,objData);
    });
};


module.exports=this;